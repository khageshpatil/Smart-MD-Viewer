# T19 — All Icon-Only Buttons Get ARIA-Label

**Priority:** P1  
**Estimated time:** 2 hours  
**Depends on:** T18 completed  
**Modifies:** `src/pages/Index.tsx`, `src/components/DocumentSidebar.tsx`, `src/components/ThemeToggle.tsx`

---

## Problem Being Solved

Icon-only buttons across the app (like theme toggle, sidebar trigger, tag delete buttons, dialog close buttons) lack `aria-label` attributes.
Screen readers read them as "button" with no context, causing accessibility failures.

This task ensures EVERY icon-only `<Button>` or `<button>` across the codebase includes a descriptive `aria-label`.

---

## Technical Specification

Audit and add `aria-label` to:
- `<SidebarTrigger>` -> `aria-label="Toggle workspace sidebar"`
- `<ThemeToggle>` -> `aria-label="Toggle dark/light theme"`
- Tag remove buttons -> `aria-label="Remove tag"`
- Folder create/rename/delete icon buttons -> `aria-label="..."`

---

## Run Build

```bash
npm run build
```

---

## Acceptance Criteria

- [ ] All icon-only buttons have explicit, descriptive `aria-label` properties.
- [ ] `npm run build` succeeds.
