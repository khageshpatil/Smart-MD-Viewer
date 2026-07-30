import { useState, useRef, useCallback } from "react";
import { FolderOpen, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const EXAMPLE_MARKDOWN = `# Welcome to SmartMD

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
> Nothing is ever uploaded to any server.`;

interface LandingHeroProps {
  onOpenFile: () => void;
  onPasteRender: (content: string, title: string) => void;
  onCreateNew: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function LandingHero({ onOpenFile, onPasteRender, onCreateNew, fileInputRef }: LandingHeroProps) {
  const [pasteContent, setPasteContent] = useState(EXAMPLE_MARKDOWN);
  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const hasMarkdown = Array.from(e.dataTransfer.items).some(
      item => item.kind === "file" && (item.type === "text/markdown" || item.type === "text/plain")
    );
    if (hasMarkdown || e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const isMarkdown =
      file.name.endsWith(".md") ||
      file.name.endsWith(".markdown") ||
      file.type === "text/markdown" ||
      file.type === "text/plain";

    if (!isMarkdown) return;

    try {
      const content = await file.text();
      onPasteRender(content, file.name.replace(/\.md(?:own)?$/i, "") || "Dropped File");
    } catch {
      // Silently ignore unreadable files
    }
  }, [onPasteRender]);

  const handleRender = () => {
    if (pasteContent.trim()) {
      onPasteRender(pasteContent.trim(), "Pasted Markdown");
    }
  };

  return (
    <div
      ref={dropRef}
      className={`relative min-h-full flex flex-col transition-all duration-200 ${
        isDragging ? "bg-primary/5 ring-2 ring-primary ring-inset" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-primary/10 backdrop-blur-sm pointer-events-none">
          <FileText className="w-16 h-16 text-primary mb-4 animate-bounce" />
          <p className="text-2xl font-bold text-primary">Drop to open</p>
          <p className="text-muted-foreground mt-1">Release to render your Markdown</p>
        </div>
      )}

      <div className="text-center pt-12 pb-6 px-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Smart MD Viewer</h1>
        <p className="text-muted-foreground text-base max-w-lg mx-auto">
          Open, render, and share Markdown — privately. Your files never leave your browser.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Button size="lg" onClick={onOpenFile} className="gap-2">
            <FolderOpen className="w-4 h-4" />
            Open .md file
          </Button>
          <Button size="lg" variant="outline" onClick={onCreateNew} className="gap-2">
            <FileText className="w-4 h-4" />
            New document
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Or drag and drop a <code className="font-mono">.md</code> file anywhere on this page
        </p>
      </div>

      <div className="flex-1 px-6 pb-8 max-w-4xl mx-auto w-full flex flex-col">
        <div className="border border-border rounded-lg overflow-hidden shadow-sm flex flex-col flex-1">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
            <span className="text-sm font-medium text-muted-foreground">
              Paste Markdown below or use the example →
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7"
                onClick={() => setPasteContent(EXAMPLE_MARKDOWN)}
              >
                Reset example
              </Button>
              <Button
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={handleRender}
              >
                Render it →
              </Button>
            </div>
          </div>
          <textarea
            className="w-full h-[400px] p-4 font-mono text-sm resize-none bg-background text-foreground focus:outline-none"
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            placeholder="Paste your Markdown here and click Render it →"
            spellCheck={false}
            aria-label="Markdown input area"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-left">
          <div className="p-4 rounded-lg border border-border bg-card/50 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
              <Shield className="w-4 h-4 text-emerald-500" />
              100% Local & Private
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your files never leave your device. Markdown is parsed and rendered entirely inside your browser memory.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-card/50 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
              <span className="text-primary font-bold text-sm">⚡</span>
              Local IndexedDB Workspace
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Organize documents into nested folders and search instantly without lag or server dependency.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-card/50 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
              <span className="text-blue-500 font-bold text-sm">🔑</span>
              AES-GCM Encryption
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Share encrypted links or <code className="font-mono text-[10px]">.smdshare</code> files protected with client-side Web Crypto keys.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground shrink-0">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>SmartMD is local-first. Nothing is ever uploaded to any server.</span>
        </div>
      </div>
    </div>
  );
}
