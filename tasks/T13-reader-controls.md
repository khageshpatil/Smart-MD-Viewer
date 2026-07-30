# T13 — Reader Controls (Font Size + Line Width)

**Priority:** P1  
**Estimated time:** 3 hours  
**Depends on:** T12 completed  
**Modifies:** 
- `src/components/ReaderControls.tsx` (NEW)
- `src/pages/Index.tsx`
- `src/index.css`

---

## Problem Being Solved

Different readers have different visual preferences for font size and column width.
`mdview.io` allows users to customize typography font size and reader column width on the fly.

This task adds dynamic reader controls to SmartMD that persist in `localStorage`.

---

## Technical Specification

1. **Reader Controls Component (`src/components/ReaderControls.tsx`):**
   - Font Size options: Small (14px), Medium (16px - default), Large (18px), XL (20px).
   - Line Width options: Compact (60ch), Standard (72ch - default), Wide (90ch), Full (100%).
   - Rendered inside a popover menu triggered by a Sliders / Type icon in the toolbar.

2. **Persistence:**
   - Store settings in `localStorage` under `smartmd_reader_settings`.

3. **CSS Classes in `src/index.css`:**
   - Add `.reader-font-sm`, `.reader-font-md`, `.reader-font-lg`, `.reader-font-xl`.
   - Add `.reader-width-compact`, `.reader-width-standard`, `.reader-width-wide`, `.reader-width-full`.

---

## Run Build

```bash
npm run build
```

---

## Acceptance Criteria

- [ ] Popover menu opens when clicking Reader Controls icon in toolbar.
- [ ] Changing Font Size dynamically changes rendered text size.
- [ ] Changing Column Width dynamically changes maximum line width.
- [ ] Settings persist across page reloads via `localStorage`.
- [ ] `npm run build` succeeds.
