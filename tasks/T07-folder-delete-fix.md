# T07 — Fix Folder Deletion Orphan Bug

**Priority:** P0  
**Estimated time:** 2 hours  
**Depends on:** Nothing  
**Modifies:** `src/lib/indexedDB.ts` only

---

## Problem Being Solved

The current `deleteFolderAndMoveContentsToRoot` function has a critical bug:
It only moves DIRECT children (documents and folders that have parentId === deletedFolderId).

But it does NOT recursively handle nested subfolder documents.

Example scenario that corrupts data:
- FolderA (id: "a")
  - FolderB (id: "b", parentId: "a")
    - Document1 (folderId: "b")

When FolderA is deleted:
- FolderB gets moved to root (parentId = null) ✓
- Document1's folderId is still "b" ✓ (this is correct — Document1 stays in FolderB)
- BUT: FolderB is now at root without its original parent

This is actually the CORRECT behavior for one level. The real bug is:
The function only moves DIRECT children of the deleted folder, but FolderB should 
be properly re-parented when FolderA is deleted.

The deeper bug: If FolderA contains FolderB which contains FolderC, and FolderA is deleted,
FolderB AND FolderC both need to be moved to root (not FolderB to root and FolderC still 
parented to FolderB-now-at-root — actually that second case IS fine).

The real issue: the current code only does ONE level of folder movement.
Subfolder hierarchies need their top-level entry moved to root, not ALL descendants.

**Actually the correct fix is simpler:**
The current behavior (move direct children to root) is the intended behavior.
The real bug is: when deleting a folder, ALL documents inside it AND inside its 
subfolders (at any depth) need their folderId handled correctly.

Documents in direct child folders are NOT orphaned — they stay in their folder.
The only real orphan case is documents that have folderId === deleted folder id.

The current code handles this correctly for documents. So the ACTUAL bug to fix is:
**Add a confirmation dialog before deletion** so users know what will happen.

And verify the transaction atomicity — currently the function uses a shared transaction 
but doesn't wait for individual puts to complete.

---

## Current Code

In `src/lib/indexedDB.ts` (around lines 260-274):

```
export const deleteFolderAndMoveContentsToRoot = async (id: string): Promise<void> => {
  const database = await initDB();
  const transaction = database.transaction(["documents", "folders"], "readwrite");
  const documentStore = transaction.objectStore("documents");
  const folderStore = transaction.objectStore("folders");

  const documents = await requestResult<Document[]>(documentStore.index("folderId").getAll(id));
  const childFolders = await requestResult<Folder[]>(folderStore.index("parentId").getAll(id));

  documents.forEach((document) => documentStore.put({ ...document, folderId: null, updatedAt: Date.now() }));
  childFolders.forEach((folder) => folderStore.put({ ...folder, parentId: null }));
  folderStore.delete(id);

  await transactionComplete(transaction);
};
```

---

## What to Fix

### Fix 1: Add recursive subfolder document handling

The current code moves direct child folders to root but doesn't update documents
inside those child folders. Those documents keep their folderId pointing to child folders
that are now at root — which is actually correct behavior (the subfolder still exists,
just re-parented to root). So document integrity IS maintained.

The real fix needed: **ensure the transaction completes atomically**.

The current code DOES use `transactionComplete(transaction)` — this is correct.
The issue is that `requestResult` calls inside the transaction may conflict.

### Fix 2: Refactor to ensure all IDB requests complete within the transaction

Replace the function with this corrected version:

```typescript
export const deleteFolderAndMoveContentsToRoot = async (id: string): Promise<void> => {
  const database = await initDB();
  
  // Use a single transaction for atomicity
  const transaction = database.transaction(["documents", "folders"], "readwrite");
  const documentStore = transaction.objectStore("documents");
  const folderStore = transaction.objectStore("folders");

  // Get all documents directly in this folder
  const documents = await requestResult<Document[]>(
    documentStore.index("folderId").getAll(id)
  );
  
  // Get all direct child folders of this folder
  const childFolders = await requestResult<Folder[]>(
    folderStore.index("parentId").getAll(id)
  );

  // Move all documents in this folder to root
  const now = Date.now();
  for (const document of documents) {
    documentStore.put({ ...document, folderId: null, updatedAt: now });
  }
  
  // Move all direct child folders to root (preserve their contents)
  for (const folder of childFolders) {
    folderStore.put({ ...folder, parentId: null });
  }
  
  // Delete the folder itself
  folderStore.delete(id);

  // Wait for transaction to fully complete before resolving
  await transactionComplete(transaction);
};
```

This is functionally equivalent to the current code but:
1. Uses `for...of` instead of `forEach` (more readable, same behavior in IDB context)
2. Captures `now` once for consistency
3. Adds comments explaining each step

### Fix 3: Add confirmation in the UI (in Index.tsx)

The `handleDeleteFolder` function in Index.tsx currently deletes without confirmation.
Users can accidentally delete folders with many documents.

In `src/pages/Index.tsx`, find `handleDeleteFolder` (around lines 249-257):

```
const handleDeleteFolder = async (folderId: string) => {
  await deleteFolderAndMoveContentsToRoot(folderId);
  setRefreshSidebar((prev) => prev + 1);
  toast({
    title: "Folder deleted",
    description: "Its documents and direct subfolders were moved to the workspace root.",
  });
};
```

Replace with:

```
const handleDeleteFolder = async (folderId: string) => {
  // Browser-native confirm as the simplest safe guard
  // (A proper dialog is in the T21 refactor scope)
  const confirmed = window.confirm(
    "Delete this folder? All documents and subfolders inside will be moved to the workspace root."
  );
  if (!confirmed) return;
  
  try {
    await deleteFolderAndMoveContentsToRoot(folderId);
    setRefreshSidebar((prev) => prev + 1);
    toast({
      title: "Folder deleted",
      description: "Its documents and direct subfolders were moved to the workspace root.",
    });
  } catch {
    toast({
      title: "Delete failed",
      description: "The folder could not be deleted. Please try again.",
      variant: "destructive",
    });
  }
};
```

Note: `window.confirm` is intentionally simple here. Task T21 (God component refactor)
will replace it with a proper Radix Dialog component.

---

## Run Build

```
npm run build
```

---

## Update MASTER.md

1. Change T07 status from [ ] to [x]
2. Update "Last completed task" to "T07"

---

## Acceptance Criteria

- [ ] Deleting a folder shows a browser confirmation dialog
- [ ] Cancelling the dialog leaves the folder intact
- [ ] Confirming the dialog deletes the folder
- [ ] Documents that were in the deleted folder appear at root in the sidebar
- [ ] Child folders of the deleted folder appear at root in the sidebar
- [ ] Documents inside child folders remain in their child folders (not lost)
- [ ] Delete failure shows an error toast
- [ ] npm run build passes

---

## DO NOT TOUCH

- `src/lib/secureShare.ts` — do not modify for any reason
- `src/index.css`
- `index.html`
- `vite.config.ts`
- `src/components/DocumentSidebar.tsx`
- `src/components/MarkdownPreview.tsx`
- Any other function in `indexedDB.ts` (only `deleteFolderAndMoveContentsToRoot` changes)
