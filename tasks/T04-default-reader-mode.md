# T04 — Default Viewer Mode (Preview, Not Split)

**Priority:** P0  
**Estimated time:** 1 hour  
**Depends on:** T03 must be complete  
**Modifies:** `src/pages/Index.tsx` only (2 line changes)

---

## Problem Being Solved

When a user opens a .md file, SmartMD defaults to "split" view (editor on left, preview on right).
This immediately signals "this is an editor" — the opposite of what we want.

mdview.io defaults to reader-only. The user sees their content, not a text editor.

This task changes the default behavior so opening any file shows the rendered preview immediately.

---

## Exact Changes Required

Open `src/pages/Index.tsx`.

### Change 1: Initial viewMode state (line ~60)

**FIND:**
```
const [viewMode, setViewMode] = useState<"preview" | "code" | "split">("split");
```

**REPLACE WITH:**
```
const [viewMode, setViewMode] = useState<"preview" | "code" | "split">("preview");
```

### Change 2: handleDocumentSelect function (lines ~124-128)

**FIND:**
```
const handleDocumentSelect = async (doc: Document) => {
  setActiveDocument(doc);
  setIsUnsavedFile(false);
  setViewMode("preview");
};
```

This already sets "preview" — no change needed here. Good.

### Change 3: handleNewDocument function (lines ~130-151)

**FIND:**
```
const handleNewDocument = async (folderId: string | null) => {
  ...
  setActiveDocument(newDoc);
  setViewMode("preview");
  ...
};
```

This already sets "preview" — no change needed here either.

### Change 4: handleMarkdownFileSelected (around line 294)

**FIND:**
```
setViewMode("preview");
```
Inside the `handleMarkdownFileSelected` function. This is already "preview" — no change needed.

### Change 5: toggleViewMode cycling order (lines ~315-319)

The toggle button cycles: code → preview → split → code
After this change, users who want split view can still toggle to it — but the default is preview.

**FIND:**
```
const toggleViewMode = () => {
  if (viewMode === "code") setViewMode("preview");
  else if (viewMode === "preview") setViewMode("split");
  else setViewMode("code");
};
```

This is fine as-is. Leave it unchanged.

---

## Summary of Changes

**Only 1 actual code change is needed:** Change the initial useState value from `"split"` to `"preview"`.

Everything else already uses `"preview"` as the default when opening/creating documents.

---

## Run Build

```
npm run build
```

---

## Update MASTER.md

1. Change T04 status from [ ] to [x]
2. Update "Last completed task" to "T04"

---

## Acceptance Criteria

- [ ] Fresh page load with no documents: shows LandingHero (from T03)
- [ ] Opening a .md file from file picker: renders in preview-only mode (no editor textarea visible)
- [ ] Creating a new document: shows in preview mode (blank preview area)
- [ ] Selecting a document from the sidebar: shows in preview mode
- [ ] Toggle button still cycles through preview → split → code correctly
- [ ] npm run build passes

---

## DO NOT TOUCH

- Everything except the one useState initialization line in Index.tsx
- `src/lib/secureShare.ts`
- `src/lib/indexedDB.ts`
- `src/index.css`
- `index.html`
- `vite.config.ts`
