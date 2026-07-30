# T18 — Sidebar Accessibility (Buttons, ARIA, Keyboard Navigation)

**Priority:** P1  
**Estimated time:** 5 hours  
**Depends on:** T17 completed  
**Modifies:** `src/components/DocumentSidebar.tsx`

---

## Problem Being Solved

The document sidebar currently relies on clickable `div` elements without proper ARIA attributes, keyboard focus states, or screen-reader roles.
This makes keyboard navigation and accessibility difficult for users relying on screen readers or tab key navigation.

This task updates `DocumentSidebar.tsx` to use semantic `<button>` elements, `aria-expanded`, `aria-selected`, `role="tree"`, `role="treeitem"`, and proper focus styles.

---

## Technical Specification

1. Replace non-semantic clickable elements (`div onClick=...`) with `<button>` elements or add proper `tabIndex={0}`, `role="button"`, and `onKeyDown` handlers.
2. Add `aria-label` attributes to folder expand/collapse triggers, action dropdowns, and document items.
3. Ensure visual focus rings (`focus-visible:ring-2 focus-visible:ring-primary`).

---

## Run Build

```bash
npm run build
```

---

## Acceptance Criteria

- [ ] Every clickable sidebar row is focusable via `Tab` key.
- [ ] Folder triggers have `aria-expanded` reflecting their open/closed state.
- [ ] Screen readers announce file titles and folder states correctly.
- [ ] `npm run build` succeeds.
