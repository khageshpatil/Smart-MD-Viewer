# T16 — Responsive Table Scroll Wrapper

**Priority:** P1  
**Estimated time:** 1 hour  
**Depends on:** T15 completed  
**Modifies:** `src/components/MarkdownPreview.tsx`

---

## Problem Being Solved

On mobile viewports or constrained reading widths, wide Markdown tables overflow their parent container and cause layout distortion or horizontal window scrolling.

This task wraps all rendered `<table>` elements in a responsive `div.overflow-x-auto` wrapper.

---

## Technical Specification

In `src/components/MarkdownPreview.tsx`, add a custom `table` component handler to `ReactMarkdown`:

```tsx
table({ children, ...props }) {
  return (
    <div className="my-6 w-full overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm" {...props}>
        {children}
      </table>
    </div>
  );
}
```

---

## Run Build

```bash
npm run build
```

---

## Acceptance Criteria

- [ ] Tables with many columns scroll horizontally within their container instead of overflowing the page.
- [ ] Table headers and borders remain styled nicely.
- [ ] `npm run build` succeeds.
