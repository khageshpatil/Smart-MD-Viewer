// src/hooks/useAgentLayer.ts
// Core hook for the /agent route.
// Manages: directory access, .md file tree scan, 2-second activity log poll,
// live re-render when the active file changes, and connection state.

import { useState, useEffect, useCallback, useRef } from "react";
import {
  saveDirectoryHandle,
  getDirectoryHandle,
  clearDirectoryHandle,
  requestReadPermission,
  requestWritePermission,
} from "@/lib/agentDB";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AgentFile {
  path: string; // relative to repo root, forward slashes
  name: string; // filename only
  lastAgentEdit?: string; // ISO timestamp from activity log
  lastAgentTool?: string; // e.g. "Edit", "Write"
  contentHash?: string; // last known hash from activity log
}

export interface ActivityEntry {
  ts: string;
  session: string;
  tool: string;
  path: string;
  hash: string;
  snapshot: string;
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

// ── Constants ─────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 2000;
const ACTIVITY_LOG_PATH = ".claude/md-activity.jsonl";

// Folders to ignore when scanning for .md files
const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "build",
  "dist",
  ".next",
  "out",
  ".vite",
  ".turbo",
  "coverage",
  ".cache",
]);

// ── File tree scanner ─────────────────────────────────────────────────────────

async function scanMdFiles(
  dirHandle: FileSystemDirectoryHandle,
  prefix = ""
): Promise<AgentFile[]> {
  const results: AgentFile[] = [];

  for await (const [name, entry] of (dirHandle as any).entries()) {
    if (entry.kind === "directory") {
      if (IGNORE_DIRS.has(name)) continue;
      try {
        const subDir = await dirHandle.getDirectoryHandle(name);
        const sub = await scanMdFiles(subDir, prefix ? `${prefix}/${name}` : name);
        results.push(...sub);
      } catch {
        // Skip unreadable directories
      }
    } else if (entry.kind === "file" && name.endsWith(".md")) {
      results.push({
        path: prefix ? `${prefix}/${name}` : name,
        name,
      });
    }
  }

  return results;
}

// ── Read a file from a directory handle by relative path ─────────────────────

async function readFileFromHandle(
  root: FileSystemDirectoryHandle,
  relPath: string
): Promise<string | null> {
  const parts = relPath.split("/");
  let current: FileSystemDirectoryHandle = root;

  try {
    for (let i = 0; i < parts.length - 1; i++) {
      current = await current.getDirectoryHandle(parts[i]);
    }
    const fileHandle = await current.getFileHandle(parts[parts.length - 1]);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch {
    return null;
  }
}

// ── Parse activity log ────────────────────────────────────────────────────────

async function readActivityLog(
  root: FileSystemDirectoryHandle
): Promise<ActivityEntry[]> {
  try {
    const claudeDir = await root.getDirectoryHandle(".claude");
    const logHandle = await claudeDir.getFileHandle("md-activity.jsonl");
    const file = await logHandle.getFile();
    const text = await file.text();
    return text
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as ActivityEntry;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as ActivityEntry[];
  } catch {
    return [];
  }
}

// ── The main hook ─────────────────────────────────────────────────────────────

export function useAgentLayer() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [repoLabel, setRepoLabel] = useState<string>("");
  const [files, setFiles] = useState<AgentFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [activeContent, setActiveContent] = useState<string>("");
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [lastPollAt, setLastPollAt] = useState<Date | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [hasClaudeHooks, setHasClaudeHooks] = useState<boolean>(true);

  const rootHandleRef = useRef<FileSystemDirectoryHandle | null>(null);
  const activeFileHashRef = useRef<string>("");
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeFilePathRef = useRef<string | null>(null);

  // Keep ref in sync so polling closure can access latest value
  useEffect(() => {
    activeFilePathRef.current = activeFilePath;
  }, [activeFilePath]);

  // ── Merge activity log into file list ──────────────────────────────────────
  const mergeActivity = useCallback(
    (baseFiles: AgentFile[], log: ActivityEntry[]): AgentFile[] => {
      // Build a map: path → most recent entry
      const latestByPath = new Map<string, ActivityEntry>();
      for (const entry of log) {
        const existing = latestByPath.get(entry.path);
        if (!existing || entry.ts > existing.ts) {
          latestByPath.set(entry.path, entry);
        }
      }

      return baseFiles.map((f) => {
        const latest = latestByPath.get(f.path);
        if (!latest) return f;
        return {
          ...f,
          lastAgentEdit: latest.ts,
          lastAgentTool: latest.tool,
          contentHash: latest.hash,
        };
      });
    },
    []
  );

  // ── Reload the active file content ─────────────────────────────────────────
  const reloadActiveFile = useCallback(async (path: string) => {
    if (!rootHandleRef.current || !path) return;
    const content = await readFileFromHandle(rootHandleRef.current, path);
    if (content !== null) {
      // Simple hash to detect changes: length + first 64 chars
      const quickHash = `${content.length}:${content.slice(0, 64)}`;
      if (quickHash !== activeFileHashRef.current) {
        activeFileHashRef.current = quickHash;
        setActiveContent(content);
      }
    }
  }, []);

  // ── Poll loop ─────────────────────────────────────────────────────────────
  const poll = useCallback(async () => {
    if (!rootHandleRef.current) return;

    const log = await readActivityLog(rootHandleRef.current);
    setActivityLog(log);
    setLastPollAt(new Date());

    // Update file list with latest agent activity
    setFiles((prev) => mergeActivity(prev, log));

    // Re-render active file if it changed
    const activePath = activeFilePathRef.current;
    if (activePath) {
      await reloadActiveFile(activePath);
    }
  }, [mergeActivity, reloadActiveFile]);

  // ── Start polling ──────────────────────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    // Run immediately on start
    poll();
  }, [poll]);

  // ── Connect with an existing persisted handle ──────────────────────────────
  const reconnectFromStorage = useCallback(async () => {
    setStatus("connecting");
    try {
      const stored = await getDirectoryHandle();
      if (!stored) {
        setStatus("disconnected");
        return false;
      }

      const granted = await requestReadPermission(stored.handle);
      if (!granted) {
        setStatus("disconnected");
        return false;
      }

      rootHandleRef.current = stored.handle;
      setRepoLabel(stored.label);
      setStatus("connected");

      setIsScanning(true);
      try {
        const claudeDir = await stored.handle.getDirectoryHandle(".claude");
        setHasClaudeHooks(!!claudeDir);
      } catch {
        setHasClaudeHooks(false);
      }

      const rawFiles = await scanMdFiles(stored.handle);
      const log = await readActivityLog(stored.handle);
      setActivityLog(log);
      setFiles(mergeActivity(rawFiles, log));
      setIsScanning(false);
      startPolling();
      return true;
    } catch {
      setIsScanning(false);
      setStatus("error");
      return false;
    }
  }, [mergeActivity, startPolling]);

  // ── Connect: user picks a new folder ──────────────────────────────────────
  const connect = useCallback(async () => {
    setStatus("connecting");
    try {
      const handle = await (window as any).showDirectoryPicker({ mode: "read" });
      await saveDirectoryHandle(handle, handle.name);

      rootHandleRef.current = handle;
      setRepoLabel(handle.name);
      setStatus("connected");

      setIsScanning(true);
      try {
        const claudeDir = await handle.getDirectoryHandle(".claude");
        setHasClaudeHooks(!!claudeDir);
      } catch {
        setHasClaudeHooks(false);
      }

      const rawFiles = await scanMdFiles(handle);
      const log = await readActivityLog(handle);
      setActivityLog(log);
      setFiles(mergeActivity(rawFiles, log));
      setIsScanning(false);
      startPolling();
    } catch (err: any) {
      setIsScanning(false);
      // User cancelled the picker — not an error
      if (err?.name === "AbortError") {
        setStatus("disconnected");
      } else {
        setStatus("error");
      }
    }
  }, [mergeActivity, startPolling]);

  // ── Disconnect ─────────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    rootHandleRef.current = null;
    await clearDirectoryHandle();
    setStatus("disconnected");
    setRepoLabel("");
    setFiles([]);
    setActiveFilePath(null);
    setActiveContent("");
    setActivityLog([]);
  }, []);

  // ── Open a file from the tree ──────────────────────────────────────────────
  const openFile = useCallback(
    async (path: string) => {
      setActiveFilePath(path);
      activeFileHashRef.current = ""; // Force reload
      await reloadActiveFile(path);
    },
    [reloadActiveFile]
  );

  // ── Read snapshot content by snapshot path (relative to repo root) ──────────
  const readSnapshotContent = useCallback(async (snapshotPath: string): Promise<string | null> => {
    if (!rootHandleRef.current) return null;
    return readFileFromHandle(rootHandleRef.current, snapshotPath);
  }, []);

  // ── Read any file content by relative path ────────────────────────────────
  const readFileContent = useCallback(async (relPath: string): Promise<string | null> => {
    if (!rootHandleRef.current) return null;
    return readFileFromHandle(rootHandleRef.current, relPath);
  }, []);

  // ── Write a file (used by Revert + Memory approve/reject) ─────────────────
  const writeFileContent = useCallback(async (
    relPath: string,
    content: string
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!rootHandleRef.current) return { ok: false, error: "No repo connected" };

    const granted = await requestWritePermission(rootHandleRef.current);
    if (!granted) return { ok: false, error: "Write permission denied" };

    const parts = relPath.split("/");
    let current: FileSystemDirectoryHandle = rootHandleRef.current;
    try {
      for (let i = 0; i < parts.length - 1; i++) {
        current = await current.getDirectoryHandle(parts[i], { create: true });
      }
      const fileHandle = await current.getFileHandle(parts[parts.length - 1], { create: true });
      const writable = await (fileHandle as any).createWritable();
      await writable.write(content);
      await writable.close();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? "Write failed" };
    }
  }, []);

  // ── Get the root handle (for Phase 3 skill scanner) ───────────────────────
  const getRootHandle = useCallback((): FileSystemDirectoryHandle | null => {
    return rootHandleRef.current;
  }, []);

  // ── On mount: try to reconnect from IndexedDB ──────────────────────────────
  useEffect(() => {
    reconnectFromStorage();
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [reconnectFromStorage]);

  return {
    status,
    repoLabel,
    files,
    activeFilePath,
    activeContent,
    activityLog,
    lastPollAt,
    isScanning,
    hasClaudeHooks,
    connect,
    disconnect,
    openFile,
    readSnapshotContent,
    readFileContent,
    writeFileContent,
    getRootHandle,
  };
}
