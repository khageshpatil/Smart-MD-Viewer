# T10 — Print Stylesheet (@media print)

**Priority:** P0  
**Estimated time:** 1 hour  
**Depends on:** T05 must be complete (we're editing index.css)  
**Modifies:** `src/index.css` only

---

## Problem Being Solved

The current `exportAsPDF` function in Index.tsx calls `window.print()`.
When the print dialog opens, it shows the ENTIRE SmartMD app — sidebar, header, toolbar,
dialogs — alongside the document content. The output looks terrible.

mdview.io is explicitly designed to be print-friendly. The printed output shows
only the document content with clean styling.

This task adds `@media print` CSS rules that hide all UI chrome during printing.

---

## Change Required

Open `src/index.css`.

At the BOTTOM of the file (after all existing rules), add the following new section:

```css
/* ============================================================
   PRINT STYLES
   These apply when the user prints or exports to PDF.
   Goal: show only the document content, hide all app chrome.
   ============================================================ */

@media print {
  /* Hide all application chrome */
  header,
  aside,
  nav,
  [data-sidebar],
  [data-radix-scroll-area-viewport] {
    display: none !important;
  }

  /* Hide the toolbar and action buttons inside the document view */
  .border-b.border-border.bg-card.p-4 {
    display: none !important;
  }

  /* Make the main content fill the full page */
  body {
    background: white !important;
    color: black !important;
  }

  main {
    width: 100% !important;
    overflow: visible !important;
  }

  /* Reset the reader container to full-width for print */
  .markdown-preview {
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    font-size: 11pt !important;
    line-height: 1.5 !important;
    color: black !important;
  }

  /* Ensure code blocks are readable in print */
  .markdown-preview pre,
  .markdown-preview code {
    background-color: #f5f5f5 !important;
    color: black !important;
    border: 1px solid #ddd !important;
    page-break-inside: avoid;
  }

  /* Headings — prevent orphaned headings at page breaks */
  .markdown-preview h1,
  .markdown-preview h2,
  .markdown-preview h3,
  .markdown-preview h4 {
    page-break-after: avoid;
    color: black !important;
  }

  /* Ensure images scale to fit the page */
  .markdown-preview img {
    max-width: 100% !important;
    height: auto !important;
    page-break-inside: avoid;
  }

  /* Tables — prevent splitting across pages when possible */
  .markdown-preview table {
    page-break-inside: avoid;
    border-collapse: collapse !important;
  }

  .markdown-preview th,
  .markdown-preview td {
    border: 1px solid #ccc !important;
    padding: 4pt 8pt !important;
    color: black !important;
    background-color: white !important;
  }

  .markdown-preview th {
    background-color: #f5f5f5 !important;
    font-weight: bold !important;
  }

  /* Blockquotes */
  .markdown-preview blockquote {
    border-left: 3pt solid #ccc !important;
    color: #444 !important;
    margin-left: 0 !important;
    padding-left: 1em !important;
  }

  /* Links — show URL in parentheses for print */
  .markdown-preview a[href]::after {
    content: " (" attr(href) ")";
    font-size: 9pt;
    color: #666;
  }

  /* But don't show URL for anchor links (starting with #) */
  .markdown-preview a[href^="#"]::after {
    content: "";
  }

  /* Mermaid diagrams — preserve SVG in print */
  .mermaid-container {
    page-break-inside: avoid;
  }

  /* Page margins for comfortable print layout */
  @page {
    margin: 1.5cm 2cm;
  }
}
```

---

## Run Build

```
npm run build
```

---

## Verify Print Output

1. Open SmartMD in a browser with a document loaded
2. Click the "Export" dropdown → "Export as PDF"
3. The browser print dialog should show ONLY the document content
4. The sidebar, header, and toolbar should be invisible in the print preview

---

## Update MASTER.md

1. Change T10 status from [ ] to [x]
2. Update "Last completed task" to "T10"
3. Note: "All P0 tasks complete. Ready for P1."

---

## Acceptance Criteria

- [ ] Print preview shows only document content (no sidebar, no header, no toolbar)
- [ ] Code blocks are readable in print (light background, dark text)
- [ ] Tables have visible borders in print
- [ ] Headings do not have orphan lines (heading at bottom of page without content below)
- [ ] Images scale to fit the page width
- [ ] Links show their URL in parentheses (helpful for PDF readers)
- [ ] Mermaid diagrams appear in print (SVG renders)
- [ ] Page has reasonable margins (1.5cm top/bottom, 2cm left/right)
- [ ] npm run build passes

---

## P0 COMPLETION NOTE

After T10 is marked [x] in MASTER.md, ALL P0 tasks are complete.

The next tasks are P1 — starting with T11 (Table of Contents).

Before starting P1, run the full app to verify:
- Landing hero shows for new users
- File drag-drop works
- Documents render in preview mode by default
- Reading width is constrained
- Print output is clean
- Bundle is significantly smaller than 1.92 MB

If any P0 task shows regressions, fix them before proceeding to P1.

---

## DO NOT TOUCH

- Any file in `src/` except `src/index.css`
- `index.html`
- `vite.config.ts`
- `tailwind.config.ts`
- `package.json`
