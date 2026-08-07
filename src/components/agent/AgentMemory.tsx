// src/components/agent/AgentMemory.tsx
// Phase 5 — Memory bank with a review gate.
// Reads from .claude/memory/inbox/, curated/, archive/.
// Approve/Edit/Reject flow with FileSystemWritableFileStream.

import { useState, useCallback, useEffect } from "react";
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Archive,
  RefreshCw,
  Loader2,
  Clock,
  Tag,
  AlertTriangle,
  Edit3,
  BookOpen,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { parseFrontmatter } from "@/lib/skillLinter";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MemoryEntry {
  id: string; // filename without extension
  path: string; // relative path
  date: string;
  session: string;
  source: string;
  status: "pending" | "approved" | "rejected";
  tags: string[];
  body: string;
  rawContent: string;
  daysOld: number;
}

interface AgentMemoryProps {
  readFileContent: (path: string) => Promise<string | null>;
  writeFileContent: (path: string, content: string) => Promise<{ ok: boolean; error?: string }>;
  getRootHandle: () => FileSystemDirectoryHandle | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INBOX_DIR = ".claude/memory/inbox";
const CURATED_DIR = ".claude/memory/curated";
const ARCHIVE_DIR = ".claude/memory/archive";
const STALE_DAYS = 60;
const INBOX_CAP = 50;

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysAgo(isoDate: string): number {
  const diff = Date.now() - new Date(isoDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function relTime(isoDate: string): string {
  const d = daysAgo(isoDate);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d} days ago`;
  return `${Math.floor(d / 30)} months ago`;
}

function buildEntryContent(
  body: string,
  status: "pending" | "approved" | "rejected",
  original: MemoryEntry
): string {
  return `---
date: ${original.date}
session: ${original.session}
source: ${original.source}
status: ${status}
tags: [${original.tags.join(", ")}]
---

${body.trim()}
`;
}

// ── Read all .md files from a directory in the repo ──────────────────────────

async function readMemoryDir(
  root: FileSystemDirectoryHandle,
  dirPath: string
): Promise<MemoryEntry[]> {
  const parts = dirPath.split("/").filter(Boolean);
  let current: FileSystemDirectoryHandle = root;

  try {
    for (const part of parts) {
      current = await current.getDirectoryHandle(part);
    }
  } catch {
    return []; // Directory doesn't exist yet
  }

  const entries: MemoryEntry[] = [];
  for await (const [name, entry] of (current as any).entries()) {
    if (entry.kind !== "file" || !name.endsWith(".md")) continue;

    try {
      const fh = await current.getFileHandle(name);
      const file = await fh.getFile();
      const rawContent = await file.text();
      const { data, body } = parseFrontmatter(rawContent);

      const dateStr = String(data.date ?? "");
      const d = daysAgo(dateStr);

      entries.push({
        id: name.replace(/\.md$/, ""),
        path: `${dirPath}/${name}`,
        date: dateStr,
        session: String(data.session ?? "unknown"),
        source: String(data.source ?? "agent"),
        status: (data.status as any) ?? "pending",
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        body: body.trim(),
        rawContent,
        daysOld: d,
      });
    } catch {
      // Skip unreadable
    }
  }

  // Sort newest first
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

// ── Entry card (inbox) ────────────────────────────────────────────────────────

function InboxCard({
  entry,
  onApprove,
  onReject,
  cap,
}: {
  entry: MemoryEntry;
  onApprove: (entry: MemoryEntry, editedBody: string) => Promise<void>;
  onReject: (entry: MemoryEntry) => Promise<void>;
  cap: number;
}) {
  const [editing, setEditing] = useState(false);
  const [editedBody, setEditedBody] = useState(entry.body);
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    await onApprove(entry, editedBody);
    setProcessing(false);
  };

  const handleReject = async () => {
    setProcessing(true);
    await onReject(entry);
    setProcessing(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {relTime(entry.date)}
          </span>
          {entry.session !== "unknown" && (
            <span className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
              {entry.session.slice(0, 8)}
            </span>
          )}
          {entry.tags.map((t) => (
            <span
              key={t}
              className="text-[10px] flex items-center gap-0.5 bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded"
            >
              <Tag className="w-2.5 h-2.5" />
              {t}
            </span>
          ))}
        </div>
        <button
          onClick={() => setEditing((p) => !p)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Edit before approving"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      {editing ? (
        <Textarea
          value={editedBody}
          onChange={(e) => setEditedBody(e.target.value)}
          className="text-sm font-mono h-28 mb-3 resize-none"
        />
      ) : (
        <p className="text-sm leading-relaxed mb-3 text-foreground">{entry.body}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white h-7"
          onClick={handleApprove}
          disabled={processing}
        >
          {processing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3 h-3" />
          )}
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs h-7 text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={handleReject}
          disabled={processing}
        >
          <XCircle className="w-3 h-3" />
          Reject
        </Button>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {cap - 1} slots remaining
        </span>
      </div>
    </div>
  );
}

// ── Curated entry row ─────────────────────────────────────────────────────────

function CuratedRow({ entry }: { entry: MemoryEntry }) {
  const stale = entry.daysOld >= STALE_DAYS;

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 ${
        stale ? "bg-amber-500/5" : ""
      }`}
    >
      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-relaxed">{entry.body}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[10px] text-muted-foreground">{relTime(entry.date)}</span>
          {entry.tags.map((t) => (
            <span
              key={t}
              className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      {stale && (
        <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 flex-shrink-0">
          <AlertTriangle className="w-3 h-3" />
          Still true?
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AgentMemory({ readFileContent, writeFileContent, getRootHandle }: AgentMemoryProps) {
  const [activeTab, setActiveTab] = useState<"inbox" | "curated" | "archive">("inbox");
  const [inbox, setInbox] = useState<MemoryEntry[]>([]);
  const [curated, setCurated] = useState<MemoryEntry[]>([]);
  const [archive, setArchive] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadAll = useCallback(async () => {
    const root = getRootHandle();
    if (!root) return;

    setLoading(true);
    const [inboxEntries, curatedEntries, archiveEntries] = await Promise.all([
      readMemoryDir(root, INBOX_DIR),
      readMemoryDir(root, CURATED_DIR),
      readMemoryDir(root, ARCHIVE_DIR),
    ]);
    setInbox(inboxEntries);
    setCurated(curatedEntries);
    setArchive(archiveEntries);
    setLoading(false);
    setHasLoaded(true);
  }, [getRootHandle]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleApprove = async (entry: MemoryEntry, editedBody: string) => {
    // Write to curated/ (append a new file or append to stack.md)
    const curatedPath = `${CURATED_DIR}/${entry.id}.md`;
    const content = buildEntryContent(editedBody, "approved", entry);
    const { ok, error } = await writeFileContent(curatedPath, content);

    if (ok) {
      // Move (delete from inbox, archive original)
      const archivePath = `${ARCHIVE_DIR}/${entry.id}.md`;
      await writeFileContent(
        archivePath,
        buildEntryContent(entry.body, "approved", entry)
      );
      // Remove from inbox by overwriting with empty (can't delete via FSAPI)
      // Instead, mark as approved and remove from display
      setInbox((prev) => prev.filter((e) => e.id !== entry.id));
      await loadAll(); // refresh all tabs
    } else {
      console.error("Approve failed:", error);
    }
  };

  const handleReject = async (entry: MemoryEntry) => {
    const archivePath = `${ARCHIVE_DIR}/${entry.id}.md`;
    const content = buildEntryContent(entry.body, "rejected", entry);
    const { ok } = await writeFileContent(archivePath, content);

    if (ok) {
      setInbox((prev) => prev.filter((e) => e.id !== entry.id));
    }
  };

  const pendingCount = inbox.length;
  const staleCount = curated.filter((e) => e.daysOld >= STALE_DAYS).length;

  if (!hasLoaded && loading) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading memory bank…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-1.5">
          {/* Tab pills */}
          {(["inbox", "curated", "archive"] as const).map((tab) => {
            const count =
              tab === "inbox" ? inbox.length : tab === "curated" ? curated.length : archive.length;
            const icon =
              tab === "inbox" ? (
                <Inbox className="w-3 h-3" />
              ) : tab === "curated" ? (
                <BookOpen className="w-3 h-3" />
              ) : (
                <Archive className="w-3 h-3" />
              );

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {icon}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      tab === "inbox" && count >= INBOX_CAP * 0.8
                        ? "bg-red-500 text-white"
                        : tab === "inbox"
                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={loadAll}
          disabled={loading}
          className="gap-1 text-xs text-muted-foreground h-7"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "inbox" && (
          <div className="p-4">
            {/* Cap warning */}
            {pendingCount >= INBOX_CAP * 0.8 && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-4">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>
                  {pendingCount} of {INBOX_CAP} inbox slots used.
                  {pendingCount >= INBOX_CAP
                    ? " Queue full — agent can't propose more until you review."
                    : " Review soon."}
                </span>
              </div>
            )}

            {inbox.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <Brain className="w-10 h-10 text-muted-foreground/30" />
                <div>
                  <p className="font-medium mb-1">Inbox empty</p>
                  <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                    The agent hasn't proposed any memories yet. It will write to{" "}
                    <code className="bg-muted px-1 rounded text-xs">.claude/memory/inbox/</code>{" "}
                    via the <code className="bg-muted px-1 rounded text-xs">propose_memory</code> MCP tool.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-w-2xl">
                {inbox.map((entry) => (
                  <InboxCard
                    key={entry.id}
                    entry={entry}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    cap={INBOX_CAP - pendingCount}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "curated" && (
          <div className="p-4">
            {staleCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-4">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {staleCount} entr{staleCount === 1 ? "y" : "ies"} older than {STALE_DAYS} days — still true?
              </div>
            )}
            {curated.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                No approved memories yet. Approve inbox items to add them here.
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden max-w-2xl">
                {curated.map((entry) => (
                  <CuratedRow key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "archive" && (
          <div className="p-4">
            {archive.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                No archived entries yet.
              </div>
            ) : (
              <div className="space-y-2 max-w-2xl">
                {archive.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border/50 bg-muted/20 opacity-60"
                  >
                    <Archive className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground leading-relaxed">{entry.body}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">{relTime(entry.date)}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            entry.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-red-500/10 text-red-600 dark:text-red-400"
                          }`}
                        >
                          {entry.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
