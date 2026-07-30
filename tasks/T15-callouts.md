# T15 — GitHub Callouts [!NOTE] [!TIP] [!WARNING] [!IMPORTANT] [!CAUTION]

**Priority:** P1  
**Estimated time:** 3 hours  
**Depends on:** T14 completed  
**Modifies:** `src/index.css`

---

## Problem Being Solved

GitHub Markdown supports callout blocks:
```markdown
> [!NOTE]
> Useful information here.

> [!WARNING]
> Critical warning here.
```
Currently in SmartMD, these render as plain blockquotes with literal `[!NOTE]` text.
`mdview.io` formats them into styled alert boxes with icons and colored borders.

This task adds CSS rules to turn blockquotes containing `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]` into styled GitHub callout cards.

---

## Technical Specification

Add CSS rule matches for blockquote paragraphs in `src/index.css`:

```css
/* GitHub Callouts / Alerts */
.markdown-preview blockquote:has(p:first-child:contains("[!NOTE]")),
.markdown-preview blockquote:has(p:first-child:contains("[!TIP]")),
.markdown-preview blockquote:has(p:first-child:contains("[!WARNING]")),
.markdown-preview blockquote:has(p:first-child:contains("[!IMPORTANT]")),
.markdown-preview blockquote:has(p:first-child:contains("[!CAUTION]")) {
  /* Styled callout borders and accents */
}
```

(Or remark plugin / custom blockquote component styling in `MarkdownPreview.tsx` if preferred for cross-browser compatibility).

---

## Run Build

```bash
npm run build
```

---

## Acceptance Criteria

- [ ] `> [!NOTE]` renders with blue left border and note styling.
- [ ] `> [!TIP]` renders with green left border and tip styling.
- [ ] `> [!WARNING]` renders with yellow/amber left border and warning styling.
- [ ] `> [!IMPORTANT]` renders with purple left border and important styling.
- [ ] `> [!CAUTION]` renders with red left border and caution styling.
- [ ] `npm run build` succeeds.
