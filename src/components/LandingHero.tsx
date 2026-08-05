import { useState, useRef, useCallback } from "react";
import { FolderOpen, FileText, Shield, Zap, Lock, Network, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const EXAMPLES = {
  markdown: `# Welcome to SmartMD

A **private**, local-first Markdown workspace. Your files never leave your browser.

## Competitive Edge

- 🚀 **Zero Server Architecture**: Everything runs in your browser
- 📊 **Rich Render**: Tables, GFM task lists, LaTeX math, footnotes
- 🔒 **AES-GCM Encrypted Sharing**: Share privately with passwords
- 🔬 **Mermaid Sandbox**: Full screen visual diagram editor
- 🗂️ **IndexedDB File System**: Nested folders, tags, and search

## Code Highlighting

\`\`\`javascript
const encrypt = async (text, passphrase) => {
  const key = await deriveAesKey(passphrase);
  return crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encode(text));
};
\`\`\`

> "The Markdown Workspace That Never Phones Home."`,
  mermaid: `# Advanced Mermaid Support

Visualize your architecture, workflows, and state machines with native Mermaid.js support.

\`\`\`mermaid
graph TD
    A[Local Client] -->|AES-GCM Encryption| B(Encrypted Blob)
    B -->|Base64 Encode| C{Share Link}
    C -->|Hash Fragment| D[Recipient Browser]
    D -->|Decrypt with Password| E[Rendered Markdown]
    
    classDef secure fill:#e8f5e9,stroke:#4caf50,stroke-width:2px;
    class A,D,E secure;
\`\`\`

Click the diagram to open it in our fullscreen **Mermaid Sandbox**.`,
  math: `# Math & Tables

SmartMD supports LaTeX math natively using KaTeX.

## Formulas

The probability of getting $k$ heads when flipping $n$ coins is:

$$P(E) = {n \\choose k} p^k (1-p)^{n-k}$$

## Complex Tables

You can export tables directly to CSV or raw Markdown format using the hover menu!

| Algorithm | Average Case | Worst Case | Memory |
|-----------|-------------|------------|--------|
| QuickSort | $O(n \\log n)$ | $O(n^2)$ | $O(\\log n)$ |
| MergeSort | $O(n \\log n)$ | $O(n \\log n)$ | $O(n)$ |
| TimSort   | $O(n \\log n)$ | $O(n \\log n)$ | $O(n)$ |
`
};

interface LandingHeroProps {
  onOpenFile: () => void;
  onPasteRender: (content: string, title: string) => void;
  onCreateNew: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function LandingHero({ onOpenFile, onPasteRender, onCreateNew, fileInputRef }: LandingHeroProps) {
  const [activeTab, setActiveTab] = useState<keyof typeof EXAMPLES>("markdown");
  const [pasteContent, setPasteContent] = useState(EXAMPLES.markdown);
  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (tab: keyof typeof EXAMPLES) => {
    setActiveTab(tab);
    setPasteContent(EXAMPLES[tab]);
  };

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
      {/* Drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-primary/10 backdrop-blur-sm pointer-events-none">
          <FileText className="w-16 h-16 text-primary mb-4 animate-bounce" />
          <p className="text-2xl font-bold text-primary">Drop to open</p>
          <p className="text-muted-foreground mt-1">Release to render your Markdown</p>
        </div>
      )}

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Subtle mesh background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/8 rounded-full blur-3xl" />
          <div className="absolute top-1/4 right-0 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-16">
          {/* Eyebrow */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary/70 bg-primary/8 px-3 py-1.5 rounded-full border border-primary/15">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              100% Private · Zero Cloud
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-center text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
            The Markdown Workspace
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-primary/70">
              That Never Phones Home.
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-center text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
            Write, organize, and securely share Markdown. Everything runs in your browser — nothing uploaded, ever.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <Button
              size="lg"
              onClick={onOpenFile}
              className="gap-2 h-12 px-8 shadow-lg shadow-primary/20 text-base"
            >
              <FolderOpen className="w-5 h-5" />
              Open .md File
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onCreateNew}
              className="gap-2 h-12 px-8 bg-background/60 backdrop-blur-sm hover:bg-muted text-base"
            >
              <Plus className="w-5 h-5" />
              New Document
            </Button>
          </div>

          {/* Drag hint */}
          <p className="text-center text-sm text-muted-foreground/70">
            Or drag & drop a{" "}
            <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground text-[11px]">.md</code>{" "}
            file anywhere on this page
          </p>
        </div>
      </section>

      {/* ── Feature cards ──────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-12 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {[
            {
              icon: Shield,
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
              title: "100% Local & Private",
              desc: "Markdown is parsed and rendered entirely inside your browser. Nothing is uploaded anywhere.",
            },
            {
              icon: Zap,
              color: "text-primary",
              bg: "bg-primary/10",
              title: "IndexedDB Workspace",
              desc: "Organize documents into nested folders, add tags, and search instantly — no server required.",
            },
            {
              icon: Lock,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
              title: "AES-GCM Encryption",
              desc: "Share encrypted links or .smdshare files protected with client-side Web Crypto keys.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="group p-5 rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3"
            >
              <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground mb-1">{card.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Live Demo Area ────────────────────────────────── */}
        <div className="border border-border rounded-2xl shadow-xl bg-card overflow-hidden flex flex-col">
          {/* Tab bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 pt-3 border-b border-border bg-muted/20 gap-2">
            <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
              {(["markdown", "mermaid", "math"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? "bg-card text-foreground border border-border border-b-card -mb-[1px] shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {tab === "markdown" ? "Features" : tab === "mermaid" ? "Mermaid Visuals" : "Math & Tables"}
                </button>
              ))}
            </div>
            <div className="flex gap-2 px-2 pb-2.5 sm:pb-0 items-center shrink-0">
              <Button
                size="sm"
                className="text-xs h-8 gap-1.5 shadow-sm"
                onClick={handleRender}
              >
                Render Preview
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Editor */}
          <div className="relative">
            {/* Line numbers */}
            <div className="absolute left-0 top-0 bottom-0 w-9 bg-muted/30 border-r border-border/50 hidden sm:flex flex-col items-center py-4 text-[10px] text-muted-foreground/40 font-mono gap-1 select-none pointer-events-none">
              {Array.from({ length: 24 }).map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
            <textarea
              className="w-full min-h-[380px] p-5 sm:pl-14 font-mono text-[13px] leading-relaxed resize-none bg-transparent text-foreground focus:outline-none"
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Paste your Markdown here and click Render Preview →"
              spellCheck={false}
              aria-label="Markdown input area"
            />
          </div>

          {/* Footer hint */}
          <div className="px-5 py-3 border-t border-border/50 bg-muted/10 flex items-center justify-between">
            <span className="text-xs text-muted-foreground/60">
              Edit the code above, then click Render Preview to see it live
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500/70" />
              <span className="text-xs text-muted-foreground/50">Local only</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
