# Smart MD Viewer vs. mdview.io

**Benchmark source:** [mdview.io](https://mdview.io/) reviewed 2026-07-30. Its published product emphasizes viewer-first opening, local file upload/drop/paste, focus mode, automatic table of contents, reading controls, large-file handling, GFM, Mermaid, KaTeX, frontmatter, sharing, responsive tables, and print/PDF workflows.

| Capability | Smart MD Viewer today | mdview.io | Winner | Missing capability / priority |
| --- | --- | --- | --- | --- |
| Default experience | Split editor/preview after creating/selecting a local record | Rendered viewer-first | mdview.io | Reader-first landing/open flow — Critical |
| Open local Markdown | No `.md` file picker, drag/drop, or paste-to-render workflow | File upload, drag/drop, clipboard paste | mdview.io | Local file ingestion with privacy copy — Critical |
| Reading long documents | Scrollable preview only | TOC, focus mode, smooth navigation | mdview.io | Heading outline, anchors, focus mode — Critical |
| Reader controls | Theme toggle | Font size and line width controls | mdview.io | Per-reader typography settings — High |
| GFM/code | `react-markdown`, GFM, Prism | GFM and syntax highlighting | Tie | Defer highlighting for performance — High |
| Mermaid | Inline renderer plus advanced sandbox | Inline rendered diagrams | Smart MD Viewer | Keep sandbox, lazy-load and harden renderer — High |
| Math/frontmatter | Unsupported | Optional KaTeX and frontmatter display | mdview.io | Add renderer pipeline extensions — High |
| Responsive tables | Typography styles only | Wide-table scrolling and exports | mdview.io | Scroll container and table exports — High |
| File scale | No documented limits; eager preview work | Claims 10 MB+ handling | mdview.io | Performance contract, worker/deferred rendering — High |
| Sharing | AES-GCM passphrase-protected URL/file share | One-click share URLs and controlled links | Tie | Retain secure local-first advantage; add limits and compatibility UX — Medium |
| Export | Markdown, print-to-PDF, HTML-based `.doc`, workspace ZIP | Print/PDF and image export | Tie | Reliable print styling and tested export semantics — Medium |
| Offline/local-first | IndexedDB workspace | Browser-local viewing is implied | Smart MD Viewer | Add PWA shell and storage recovery UX — High |
| SEO/content | Minimal metadata/robots | Content-led public product pages | mdview.io | Metadata, docs, searchable public reader strategy — Medium |
| Project management | Tickets and GitHub PR links | Not a primary capability | Smart MD Viewer | Preserve without adding scope — Low |

## Positioning Decision

Smart MD Viewer should not copy an editor-centric tool. It should become a **private, local-first reader with an excellent optional editor**:

1. Open a local file, paste Markdown, or select a local workspace document.
2. Render a polished reader by default, with TOC/focus/typography controls.
3. Let users edit, organize, export, and securely share without uploading their content.
4. Keep tickets as an advanced, separate workflow rather than competing in the primary header or blank state.

## Differentiated Launch Narrative

> Read and organize Markdown locally, render diagrams safely, edit when needed, and share encrypted documents without sending content to a server.

This differentiates from a simple online viewer while closing the reader-first gaps that currently make `mdview.io` more immediately useful.
