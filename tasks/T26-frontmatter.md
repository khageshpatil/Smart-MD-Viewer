# T26 — Frontmatter Display Panel (remark-frontmatter)

**Priority:** P2  
**Estimated time:** 3 hours  
**Depends on:** T25 completed  
**Modifies:** `package.json`, `src/components/MarkdownPreview.tsx`

---

## Problem Being Solved

Jekyll, Hugo, and Obsidian Markdown files contain YAML frontmatter blocks at the top (`--- title: My Doc \n author: Alex ---`).
Currently, raw YAML blocks either disappear or render as plain text in the document body.

This task adds `remark-frontmatter` to cleanly parse and render frontmatter metadata into a styled metadata card.

---

## Technical Specification

1. Install `remark-frontmatter`:
   `npm install remark-frontmatter`
2. Add `remarkFrontmatter` to `remarkPlugins` in `src/components/MarkdownPreview.tsx`.

---

## Run Build

```bash
npm run build
```

---

## Acceptance Criteria

- [ ] YAML frontmatter blocks at top of files render in a clean metadata header card.
- [ ] `npm run build` succeeds.
