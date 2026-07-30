# T06 — Fix autoSave Timer Leak on Document Switch / Unmount

**Priority:** P0  
**Estimated time:** 1 hour  
**Depends on:** Nothing  
**Modifies:** `src/pages/Index.tsx` only (3 targeted changes)

---

## Problem Being Solved

SmartMD has a 500ms debounced autosave. When a user edits a document and then quickly switches
to another document (within 500ms), the pending save for the OLD document fires AFTER the
new document is active.

Worst case: the old document's content is written to the wrong record, or the state-based
`setRefreshSidebar` call causes a remount loop with stale state.

Additionally, when the component unmounts, the timer is never cancelled — causing a React
"can't update state on unmounted component" warning.

---

## Current Code (what exists today)

In `src/pages/Index.tsx`:

**The timer ref declaration (around line 69):**
```
const saveTimeoutRef = useRef<NodeJS.Timeout>();
```

**The cleanup effect (around lines 105-107) — this exists but only cleans up on unmount:**
```
useEffect(() => () => {
  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
}, []);
```

**The autoSave function (around lines 110-122):**
```
const autoSave = useCallback((doc: Document) => {
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
  }
  saveTimeoutRef.current = setTimeout(async () => {
    try {
      await saveDocument(doc);
      setRefreshSidebar((prev) => prev + 1);
    } catch {
      toast({ title: "Save failed", description: "Your latest changes could not be saved locally.", variant: "destructive" });
    }
  }, 500);
}, [toast]);
```

**The handleDocumentSelect function (around lines 124-128):**
```
const handleDocumentSelect = async (doc: Document) => {
  setActiveDocument(doc);
  setIsUnsavedFile(false);
  setViewMode("preview");
};
```

---

## Exact Changes Required

### Change 1: Cancel pending save BEFORE switching documents

In `handleDocumentSelect`, add timer cancellation BEFORE switching the active document:

**FIND:**
```
const handleDocumentSelect = async (doc: Document) => {
  setActiveDocument(doc);
  setIsUnsavedFile(false);
  setViewMode("preview");
};
```

**REPLACE WITH:**
```
const handleDocumentSelect = async (doc: Document) => {
  // Cancel any pending autosave for the previously active document
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = undefined;
  }
  setActiveDocument(doc);
  setIsUnsavedFile(false);
  setViewMode("preview");
};
```

### Change 2: Also flush the save on document switch (optional but recommended)

When switching away from a document that has a pending save, we should flush it immediately
rather than discard. This prevents data loss if the user edits then quickly switches.

Update the autoSave function to track a "flush" mechanism.

Actually, the simplest safe approach: in `handleDocumentSelect`, BEFORE cancelling the timer,
do a synchronous save if there's a pending timer AND the active document is not null AND
the activeDocument is not the unsaved file type:

**FIND the full handleDocumentSelect (the version we're replacing above) and use this instead:**

```
const handleDocumentSelect = async (doc: Document) => {
  // If there's a pending autosave for the current document, flush it immediately
  if (saveTimeoutRef.current && activeDocument && !isUnsavedFile) {
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = undefined;
    try {
      await saveDocument(activeDocument);
    } catch {
      // Silent — we're switching away, best effort save
    }
  } else if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = undefined;
  }
  setActiveDocument(doc);
  setIsUnsavedFile(false);
  setViewMode("preview");
};
```

Note: `activeDocument` and `isUnsavedFile` are accessible in this function because they are
in the component's closure (useState values at the top of the component).

### Change 3: Verify the unmount cleanup exists

The cleanup effect on lines 105-107 should already exist:
```
useEffect(() => () => {
  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
}, []);
```

If it does NOT exist, add it. If it exists, leave it as-is — it's correct.

---

## Run Build

```
npm run build
```

---

## Update MASTER.md

1. Change T06 status from [ ] to [x]
2. Update "Last completed task" to "T06"

---

## Acceptance Criteria

- [ ] Edit a document, then immediately switch to another document (within 500ms)
- [ ] The original document's content is saved correctly (not lost)
- [ ] The new document's content is not overwritten by the old document's autosave
- [ ] No React warnings about "can't update state on unmounted component"
- [ ] Normal autosave still works (edit content, wait 500ms, changes persist after refresh)
- [ ] npm run build passes

---

## DO NOT TOUCH

- `src/lib/secureShare.ts`
- `src/lib/indexedDB.ts` 
- `src/index.css`
- `index.html`
- `vite.config.ts`
- `src/components/DocumentSidebar.tsx`
- `src/components/MarkdownPreview.tsx`
- All other functions in Index.tsx (only handleDocumentSelect changes)
