// src/lib/agentDB.ts
// Manages the IndexedDB store for Agent Layer directory handle persistence.
// Stores FileSystemDirectoryHandle so the user only needs to pick a repo once.

const AGENT_DB_NAME = "SmartMDAgent";
const AGENT_DB_VERSION = 1;
const HANDLE_STORE = "directoryHandles";

let agentDb: IDBDatabase | null = null;

function openAgentDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (agentDb) {
      resolve(agentDb);
      return;
    }

    const req = indexedDB.open(AGENT_DB_NAME, AGENT_DB_VERSION);

    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      agentDb = req.result;
      resolve(agentDb);
    };
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(HANDLE_STORE)) {
        db.createObjectStore(HANDLE_STORE, { keyPath: "id" });
      }
    };
  });
}

export interface StoredHandle {
  id: string; // always "primary" for the main repo handle
  handle: FileSystemDirectoryHandle;
  label: string; // display name shown in the UI
  connectedAt: number;
}

export async function saveDirectoryHandle(
  handle: FileSystemDirectoryHandle,
  label: string
): Promise<void> {
  const db = await openAgentDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, "readwrite");
    const store = tx.objectStore(HANDLE_STORE);
    const entry: StoredHandle = {
      id: "primary",
      handle,
      label,
      connectedAt: Date.now(),
    };
    const req = store.put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getDirectoryHandle(): Promise<StoredHandle | null> {
  const db = await openAgentDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, "readonly");
    const store = tx.objectStore(HANDLE_STORE);
    const req = store.get("primary");
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function clearDirectoryHandle(): Promise<void> {
  const db = await openAgentDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, "readwrite");
    const store = tx.objectStore(HANDLE_STORE);
    const req = store.delete("primary");
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Request read permission for a stored handle. Returns true if granted.
 * Must be called from a user gesture on first load (permission prompt).
 */
export async function requestReadPermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  const perm = await handle.queryPermission({ mode: "read" });
  if (perm === "granted") return true;
  const result = await handle.requestPermission({ mode: "read" });
  return result === "granted";
}

/**
 * Request readwrite permission for a stored handle.
 * Only called by Revert (Phase 2) — never requested upfront.
 */
export async function requestWritePermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  const perm = await handle.queryPermission({ mode: "readwrite" });
  if (perm === "granted") return true;
  const result = await handle.requestPermission({ mode: "readwrite" });
  return result === "granted";
}
