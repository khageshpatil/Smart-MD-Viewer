# T12 — Focus Mode (Hide Chrome, Hotkeys 'F' / 'Escape')

**Priority:** P1  
**Estimated time:** 4 hours  
**Depends on:** T11 completed  
**Modifies:** `src/pages/Index.tsx`

---

## Problem Being Solved

When reading long articles, technical documentation, or books, sidebars and headers create visual distraction.
`mdview.io` features a distraction-free "Focus Mode" that hides all application chrome.

This task adds Focus Mode to SmartMD, toggled by a toolbar button or pressing `F` / `Escape`.

---

## Technical Specification

1. Add `isFocusMode` state (`useState(false)`).
2. When `isFocusMode` is true:
   - Hide sidebar header and trigger.
   - Hide document title and action toolbar.
   - Expand reading container to fill entire viewport with max reading width.
   - Show a subtle floating "Exit Focus Mode (Esc)" button at top right.
3. Keyboard shortcuts:
   - Pressing `F` / `f` when not typing in an input/textarea toggles Focus Mode.
   - Pressing `Escape` exits Focus Mode.

---

## Run Build

```bash
npm run build
```

---

## Acceptance Criteria

- [ ] Pressing `F` or clicking the Focus Mode button hides all sidebars and headers.
- [ ] Pressing `Escape` or `F` exits Focus Mode cleanly.
- [ ] A subtle floating exit button appears at top right in Focus Mode.
- [ ] `npm run build` succeeds.
