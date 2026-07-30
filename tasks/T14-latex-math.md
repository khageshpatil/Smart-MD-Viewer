# T14 — LaTeX Math (remark-math + rehype-katex)

**Priority:** P1  
**Estimated time:** 4 hours  
**Depends on:** T13 completed  
**Modifies:**
- `package.json`
- `src/components/MarkdownPreview.tsx`
- `index.html` (or KaTeX CSS import)

---

## Problem Being Solved

Technical and scientific Markdown documents frequently use LaTeX formulas (`$E=mc^2$` or `$$\sum_{i=1}^n i$$`).
`mdview.io` renders LaTeX math seamlessly using KaTeX.

This task adds LaTeX math rendering support to SmartMD using `remark-math` and `rehype-katex`.

---

## Technical Specification

1. Install dependencies:
   `npm install remark-math rehype-katex katex`

2. Import KaTeX CSS in `index.html` or `src/index.css`:
   `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">`
   (or `@import "katex/dist/katex.min.css";` in `src/index.css`)

3. Update `src/components/MarkdownPreview.tsx`:
   - Import `remarkMath` from `remark-math`.
   - Import `rehypeKatex` from `rehype-katex`.
   - Add `remarkMath` to `remarkPlugins`.
   - Add `rehypeKatex` to `rehypePlugins`.

---

## Run Build

```bash
npm run build
```

---

## Acceptance Criteria

- [ ] Inline `$E=mc^2$` renders formatted math equation.
- [ ] Block `$$\int_0^\infty x^2 dx$$` renders centered block math equation.
- [ ] Non-math text and inline code blocks are untouched.
- [ ] `npm run build` succeeds.
