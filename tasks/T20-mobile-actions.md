# T20 — Context Menu Alternatives for Mobile

**Priority:** P1  
**Estimated time:** 3 hours  
**Depends on:** T19 completed  
**Modifies:** `src/components/DocumentSidebar.tsx`

---

## Problem Being Solved

On touch devices (smartphones and tablets), right-click context menus are hard or impossible to trigger.
`mdview.io` provides inline three-dot `(...)` action menus for mobile users.

This task adds an explicit `MoreVertical` dropdown menu trigger on hover/mobile touch for document and folder items in `DocumentSidebar.tsx`.

---

## Technical Specification

Add a `DropdownMenu` next to the document/folder item name that appears on hover or mobile tap, offering the same options (Rename, Delete, Pin, Add Tag) as the right-click context menu.

---

## Run Build

```bash
npm run build
```

---

## Acceptance Criteria

- [ ] Every folder and document item in sidebar has an accessible `MoreVertical` menu button.
- [ ] Mobile users can rename, delete, pin, and tag documents without right-clicking.
- [ ] `npm run build` succeeds.
