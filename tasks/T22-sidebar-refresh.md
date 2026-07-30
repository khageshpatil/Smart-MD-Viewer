# T22 — Replace key={refreshSidebar} with Custom Event Subscription

**Priority:** P1  
**Estimated time:** 4 hours  
**Depends on:** T21 completed  
**Modifies:** `src/pages/Index.tsx`, `src/components/DocumentSidebar.tsx`

---

## Problem Being Solved

`DocumentSidebar` is currently force-remounted on every workspace document update using `key={refreshSidebar}` (`<DocumentSidebar key={refreshSidebar} ... />`).
Force-remounting destroys scroll position, collapses open folders, and loses focus state in the sidebar tree.

This task replaces key-based remounting with a custom event bus (`workspace-updated`) so `DocumentSidebar` smoothly re-fetches its data without losing state.

---

## Technical Specification

1. Emit `window.dispatchEvent(new CustomEvent("workspace-updated"))` whenever documents/folders are created, updated, or deleted.
2. In `DocumentSidebar.tsx`, subscribe to `"workspace-updated"` event in a `useEffect` to trigger `loadData()`.
3. Remove `key={refreshSidebar}` from `<DocumentSidebar>` in `Index.tsx`.

---

## Run Build

```bash
npm run build
```

---

## Acceptance Criteria

- [ ] Creating, deleting, or renaming a document refreshes sidebar content smoothly without collapsing open folders.
- [ ] `key={refreshSidebar}` is completely removed.
- [ ] `npm run build` succeeds.
