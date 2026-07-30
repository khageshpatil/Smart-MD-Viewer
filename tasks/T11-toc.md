# T11 — Table of Contents (Headings, Scroll, Keyboard 'T')

**Priority:** P1  
**Estimated time:** 4 hours  
**Depends on:** P0 completed  
**Modifies:** 
- `src/components/TableOfContents.tsx` (NEW)
- `src/components/MarkdownPreview.tsx` (Add heading IDs)
- `src/pages/Index.tsx` (Add TOC state, toggle button, keyboard shortcut 'T')

---

## Problem Being Solved

Long Markdown documents are difficult to navigate without an outline.
`mdview.io` provides an auto-generated Table of Contents from headings, allowing users to quickly jump to sections.

This task adds an interactive, floating/collapsible Table of Contents sidebar for long Markdown files in SmartMD.

---

## Technical Design & Implementation Details

### Step 1: Add Heading IDs in `src/components/MarkdownPreview.tsx`

In `MarkdownPreview.tsx`, add custom components for `h1`, `h2`, `h3`, `h4`, `h5`, `h6` so each rendered heading receives a slugified `id`:

```tsx
const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

// Inside ReactMarkdown components prop:
h1: ({ children, ...props }) => {
  const text = String(children);
  const id = slugify(text);
  return <h1 id={id} {...props}>{children}</h1>;
},
h2: ({ children, ...props }) => {
  const text = String(children);
  const id = slugify(text);
  return <h2 id={id} {...props}>{children}</h2>;
},
h3: ({ children, ...props }) => {
  const text = String(children);
  const id = slugify(text);
  return <h3 id={id} {...props}>{children}</h3>;
},
```

### Step 2: Create `src/components/TableOfContents.tsx`

Create a component that extracts headings from markdown text:

```tsx
export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function extractHeadings(markdown: string): TocItem[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const rawText = match[2].trim();
    // Clean inline markdown links/code from heading text for display
    const text = rawText.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/`([^`]+)`/g, "$1");
    const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
    headings.push({ id, text, level });
  }

  return headings;
}
```

Render an outline list with indentation according to heading level.
On click, call `document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })`.

### Step 3: Integrate with `src/pages/Index.tsx`

1. Add `showToc` state (`useState(false)`).
2. Add a TOC toggle button to the document header/toolbar (using `ListTree` or `AlignLeft` icon from `lucide-react`).
3. Add a keydown listener for `'t'` or `'T'` (when not focused in a text input/textarea) to toggle `showToc`.
4. Render `<TableOfContents markdown={activeDocument.content} onClose={() => setShowToc(false)} />` when `showToc` is true.

---

## Run Build

```bash
npm run build
```

---

## Update MASTER.md

1. Change T11 status from `[ ]` to `[x]`
2. Update "Last completed task" to "T11"

---

## Acceptance Criteria

- [ ] Opening any Markdown file with headings extracts a structured TOC.
- [ ] Clicking a heading in TOC smoothly scrolls to that section in the preview.
- [ ] Pressing keyboard shortcut `T` toggles the Table of Contents panel.
- [ ] A toolbar button toggles the TOC panel.
- [ ] `npm run build` succeeds without TypeScript or Vite errors.
