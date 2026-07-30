# T21 — Split Index.tsx God Component into Sub-Components

**Priority:** P1  
**Estimated time:** 12 hours  
**Depends on:** T20 completed  
**Modifies:** `src/pages/Index.tsx`, `src/components/DocumentHeader.tsx`, `src/components/DocumentToolbar.tsx`, `src/components/ShareDialog.tsx`

---

## Problem Being Solved

`Index.tsx` grew to 1000+ lines, combining workspace navigation, header rendering, dialog management, encryption, and document editing.

This task modularizes `Index.tsx` by extracting cleanly decoupled sub-components:
- `DocumentHeader.tsx` (App header, search/actions)
- `DocumentToolbar.tsx` (View mode, focus, TOC, reader controls, export, share buttons)
- `ShareDialog.tsx` (Encrypted link & file sharing modal)

---

## Technical Specification

Extract modular sub-components into `src/components/` without breaking props or state contracts.

---

## Run Build

```bash
npm run build
```

---

## Acceptance Criteria

- [ ] `Index.tsx` file size is reduced significantly (< 400 lines).
- [ ] Header, toolbar, and share dialog operate as decoupled sub-components.
- [ ] `npm run build` succeeds without errors.
