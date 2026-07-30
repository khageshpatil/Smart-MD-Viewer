# T25 — Table CSV/Markdown Export Button

**Priority:** P2  
**Estimated time:** 4 hours  
**Depends on:** T24 completed  
**Modifies:** `src/components/MarkdownPreview.tsx`

---

## Problem Being Solved

Data analysts, developers, and project managers often view Markdown tables containing tabular data and want to export or copy them as CSV or TSV files.

This task adds an inline "Copy as CSV" or "Export CSV" action button on hover over rendered Markdown tables.

---

## Technical Specification

In `src/components/MarkdownPreview.tsx`:
Add a hover toolbar to the custom `table` wrapper with:
- "Copy CSV": Converts table rows/cells to comma-separated values and copies to clipboard.

---

## Run Build

```bash
npm run build
```

---

## Acceptance Criteria

- [ ] Hovering over any rendered table reveals a "Copy CSV" button.
- [ ] Clicking "Copy CSV" copies formatted CSV text to the user's clipboard and triggers a toast.
- [ ] `npm run build` succeeds.
