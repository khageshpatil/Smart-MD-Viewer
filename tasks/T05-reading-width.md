# T05 — Reading Width Constraint

**Priority:** P0  
**Estimated time:** 30 minutes  
**Depends on:** Nothing (can run in parallel with other P0 tasks, but after T01)  
**Modifies:** `src/index.css` only

---

## Problem Being Solved

Rendered Markdown currently stretches to fill 100% of the viewport width.
On a wide monitor (1440px+), text lines become 200+ characters long — unreadable.

Best practice for reading comfort: 65–75 characters per line (~700px).
mdview.io constrains content to ~700-800px. Medium, Notion, GitHub all do the same.

This task adds a max-width constraint to the Markdown preview content area.

---

## Exact Change Required

Open `src/index.css`.

Find the `.markdown-preview` rule block (currently around lines 118-131):

```css
.markdown-preview {
  @apply prose prose-slate max-w-none;
  @apply prose-headings:font-bold prose-headings:tracking-tight;
  @apply prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl;
  @apply prose-p:leading-relaxed prose-p:text-foreground;
  @apply prose-a:text-primary prose-a:no-underline hover:prose-a:underline;
  @apply prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm;
  @apply prose-pre:bg-code-bg prose-pre:text-code-text;
  @apply prose-img:rounded-lg prose-img:shadow-md;
}
```

**REPLACE WITH:**

```css
.markdown-preview {
  @apply prose prose-slate max-w-none;
  @apply prose-headings:font-bold prose-headings:tracking-tight;
  @apply prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl;
  @apply prose-p:leading-relaxed prose-p:text-foreground;
  @apply prose-a:text-primary prose-a:no-underline hover:prose-a:underline;
  @apply prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm;
  @apply prose-pre:bg-code-bg prose-pre:text-code-text;
  @apply prose-img:rounded-lg prose-img:shadow-md;
  
  /* Reading width constraint: comfortable 65-75 chars per line */
  max-width: 72ch;
  margin-left: auto;
  margin-right: auto;
  
  /* Ensure padding on mobile */
  padding-left: 1rem;
  padding-right: 1rem;
}
```

**Important:** `max-w-none` in the Tailwind prose class normally removes the prose max-width.
The explicit `max-width: 72ch` CSS property overrides that Tailwind prose constraint,
giving us a character-based width (72 characters) instead of a pixel value.
`72ch` is approximately 720px with a 10px base font size — ideal for reading.

---

## Note on split view

In split view (editor + preview side by side), the preview pane is already constrained by
its flex-1 container. The max-width will apply within the pane's available width.
This is the correct behavior — in split view, the pane IS the constraint.

If the preview pane is narrower than 72ch, the content will fill the pane width
(because max-width is a maximum, not a minimum). This is correct behavior.

---

## Run Build

```
npm run build
```

---

## Update MASTER.md

1. Change T05 status from [ ] to [x]
2. Update "Last completed task" to "T05"

---

## Acceptance Criteria

- [ ] Opening a long Markdown document: content is centered and constrained to ~720px
- [ ] On mobile (< 720px viewport): content fills the width with 1rem padding on each side
- [ ] In split view: preview pane content still looks correct
- [ ] Tables, code blocks, and images do NOT break or overflow the container
- [ ] npm run build passes with no errors

---

## DO NOT TOUCH

- `src/pages/Index.tsx` (only the CSS file changes)
- `src/lib/secureShare.ts`
- `src/lib/indexedDB.ts`
- `index.html`
- `vite.config.ts`
- `tailwind.config.ts`
