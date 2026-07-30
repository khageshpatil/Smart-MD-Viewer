# T17 — Heading Anchor Links (Stable Slugs + Copy Link)

**Priority:** P1  
**Estimated time:** 3 hours  
**Depends on:** T16 completed  
**Modifies:** `src/components/MarkdownPreview.tsx`

---

## Problem Being Solved

In technical documentation, readers frequently want to share a direct link to a specific section or heading.
`mdview.io` renders hoverable `#` anchor icons next to all headings that allow copying or jumping directly to that section URL hash.

This task adds hoverable anchor links to headings in SmartMD.

---

## Technical Specification

In `src/components/MarkdownPreview.tsx`, update `h1`, `h2`, `h3`, `h4` custom heading components:

```tsx
const renderHeading = (Tag: 'h1' | 'h2' | 'h3' | 'h4', children: React.ReactNode, props: any) => {
  const text = String(children).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/`([^`]+)`/g, "$1");
  const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
  
  return (
    <Tag id={id} className="group relative flex items-center" {...props}>
      <span>{children}</span>
      <a
        href={`#${id}`}
        className="ml-2 text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity"
        title="Direct link to section"
        onClick={(e) => {
          e.preventDefault();
          window.history.pushState(null, "", `#${id}`);
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        #
      </a>
    </Tag>
  );
};
```

---

## Run Build

```bash
npm run build
```

---

## Acceptance Criteria

- [ ] Hovering over any heading (`h1`, `h2`, `h3`, `h4`) reveals a subtle `#` anchor link.
- [ ] Clicking the anchor link updates the URL location hash and smoothly scrolls to the section.
- [ ] `npm run build` succeeds.
