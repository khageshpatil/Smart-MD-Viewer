# T03 — Reader-First Landing Hero

**Priority:** P0  
**Estimated time:** 8 hours  
**Depends on:** T01, T02 must be complete  
**Modifies:** `src/pages/Index.tsx` + new `src/components/LandingHero.tsx`

---

## Problem Being Solved

Landing on SmartMD with no documents shows a plain "Document Workspace" with two small buttons.
Users have no idea what the app does. They immediately leave.

mdview.io shows a live Markdown editor with pre-populated example content. Users get value in 5 seconds.

This task replaces the blank empty-state with a proper landing hero: drag-drop zone, paste-to-render,
file picker button, and a privacy statement.

---

## Step 1 — Create src/components/LandingHero.tsx

Create a completely new file at `src/components/LandingHero.tsx`.

The component receives four props:
- `onOpenFile: () => void` — triggers the existing file picker
- `onPasteRender: (content: string, title: string) => void` — renders pasted/dropped content
- `onCreateNew: () => void` — creates a new blank document
- `fileInputRef: React.RefObject<HTMLInputElement>` — reference to the hidden file input

The component must:
1. Show a full-height layout with a heading and subtitle
2. Have two primary action buttons: "Open .md file" and "New document"
3. Have a large textarea pre-filled with EXAMPLE_MARKDOWN (see below)
4. Have "Render it →" and "Reset example" buttons next to the textarea
5. Handle drag-over state (visual highlight on the container)
6. Handle drop of .md files (call onPasteRender with file contents)
7. Show a privacy badge at the bottom

### EXAMPLE_MARKDOWN constant to use:

```
# Welcome to SmartMD

A **private**, local-first Markdown viewer. Your files never leave your browser.

## Features

- Renders GFM, tables, task lists, code blocks
- Mermaid diagrams with a full sandbox editor  
- Encrypted document sharing (AES-GCM — no server)
- Local workspace with folders, tags, and search

## Example Table

| Feature           | SmartMD | mdview.io |
|-------------------|---------|-----------|
| Local workspace   | Yes     | No        |
| Encrypted share   | Yes     | No        |
| LaTeX math        | Soon    | Yes       |
| Table of Contents | Soon    | Yes       |

## Code Example

    const encrypt = async (text, passphrase) => {
      const key = await deriveAesKey(passphrase);
      return crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encode(text));
    };

> Your documents are processed entirely in your browser.
> Nothing is ever uploaded to any server.
```

### Drop handler logic:

```
When a file is dropped onto this component:
1. Call e.preventDefault() and e.stopPropagation()
2. Get the first file from e.dataTransfer.files
3. Check if file.name ends with .md or .markdown
4. If yes: read file.text(), call onPasteRender(content, cleanTitle)
   where cleanTitle = file.name with .md/.markdown extension removed
5. Set isDragging back to false
```

### Drag-over visual:
When isDragging is true, show an absolute-positioned overlay with:
- Semi-transparent blue/primary background
- A FileText icon that bounces (animate-bounce)
- Text "Drop to open" in large bold font
- Text "Release to render your Markdown" as subtitle

### Privacy badge:
A small centered line at the bottom with a Shield icon (green) and text:
"Files are processed locally. Nothing is uploaded to any server."

---

## Step 2 — Add handlePasteRender to Index.tsx

Open `src/pages/Index.tsx`.

After the `handleSaveLocalFile` function (around line 313), add this new function:

```
const handlePasteRender = useCallback((content: string, title = "Pasted Markdown") => {
  const now = Date.now();
  setActiveDocument({
    id: `local-${crypto.randomUUID()}`,
    title,
    content,
    folderId: null,
    tags: [],
    isPinned: false,
    createdAt: now,
    updatedAt: now,
  });
  setIsUnsavedFile(true);
  setViewMode("preview");
}, []);
```

Note: `useCallback` is already imported at line 1 of Index.tsx.

---

## Step 3 — Add window-level drag-drop useEffect to Index.tsx

Add this useEffect inside the Index component, near the other useEffects at the top:

```
useEffect(() => {
  const handleWindowDrop = async (e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (!file) return;
    const isMarkdown = file.name.endsWith(".md") || 
                       file.name.endsWith(".markdown") || 
                       file.type === "text/markdown";
    if (!isMarkdown) return;
    try {
      const content = await file.text();
      const title = file.name.replace(/\.md(?:own)?$/i, "") || "Dropped File";
      handlePasteRender(content, title);
    } catch { /* ignore unreadable files */ }
  };

  const handleWindowDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  window.addEventListener("drop", handleWindowDrop);
  window.addEventListener("dragover", handleWindowDragOver);
  return () => {
    window.removeEventListener("drop", handleWindowDrop);
    window.removeEventListener("dragover", handleWindowDragOver);
  };
}, [handlePasteRender]);
```

Note: Add `handlePasteRender` to the dependency array.

---

## Step 4 — Add LandingHero import to Index.tsx

At the top of Index.tsx, after the lazy imports for MermaidSandbox and MarkdownPreview, add:

```
import { LandingHero } from "@/components/LandingHero";
```

This is a static import (not lazy) — LandingHero should load immediately.

---

## Step 5 — Replace empty state block in Index.tsx

Find this block (approximately lines 703–722 in the original file):

```
{!activeDocument ? (
  <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
    <div className="p-6 rounded-full bg-muted/50 mb-6">
      <FileText className="w-16 h-16 text-muted-foreground" />
    </div>
    <h2 className="text-2xl font-bold mb-2">Document Workspace</h2>
    <p className="text-muted-foreground mb-6 max-w-md">
      Open a local Markdown file to read it, or create a workspace document.
    </p>
    <div className="flex flex-wrap justify-center gap-3">
      <Button onClick={handleOpenMarkdownFile}>
        <FolderOpen className="w-4 h-4 mr-2" />
        Open Markdown
      </Button>
      <Button variant="outline" onClick={() => handleNewDocument(null)}>
        <FileText className="w-4 h-4 mr-2" />
        Create New Document
      </Button>
    </div>
  </div>
) : (
```

Replace ONLY this block with:

```
{!activeDocument ? (
  <LandingHero
    onOpenFile={handleOpenMarkdownFile}
    onPasteRender={handlePasteRender}
    onCreateNew={() => handleNewDocument(null)}
    fileInputRef={localFileInputRef}
  />
) : (
```

Everything after `): (` stays the same.

---

## Step 6 — Run build and fix TypeScript errors

```
npm run build
```

Common TypeScript errors to expect and fix:
- `Property 'fileInputRef' does not exist on LandingHeroProps` — check the interface definition
- `handlePasteRender` not found — check you added it before the JSX return
- `useCallback` import issue — it is already at line 1 of Index.tsx

---

## Step 7 — Update MASTER.md

1. Change T03 status from [ ] to [x]
2. Update "Last completed task" to "T03"
3. Note in Current State Snapshot: "Landing hero implemented. Drag-drop works."

---

## Acceptance Criteria

- [ ] SmartMD landing with no documents shows the new LandingHero component
- [ ] "Open .md file" button triggers file picker and renders in preview mode
- [ ] Dragging a .md file onto the landing page renders it immediately
- [ ] Dragging a .md file when a document IS open also renders it (window handler)
- [ ] Paste textarea has example Markdown pre-filled
- [ ] "Render it →" renders the textarea content
- [ ] "Reset example" resets to the original EXAMPLE_MARKDOWN
- [ ] Privacy badge is visible: "Files are processed locally"
- [ ] Drop highlight animation shows when dragging over the page
- [ ] npm run build succeeds with no TypeScript errors
- [ ] Existing workspace features still work (sidebar, create doc, etc.)

---

## DO NOT TOUCH

- `src/lib/secureShare.ts` — do not modify
- `src/lib/indexedDB.ts` — do not modify (T07 task)
- `src/index.css` — do not modify (T05, T10 tasks)
- `index.html` — do not modify (T08, T09 tasks)
- `vite.config.ts` — do not modify
- `tailwind.config.ts` — do not modify
- `src/components/DocumentSidebar.tsx` — do not modify
- `src/components/MarkdownPreview.tsx` — do not modify
