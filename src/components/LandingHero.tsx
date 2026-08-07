import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { FileText, Shield, Lock, Download, Code2, Sparkles, ArrowRight, Check } from "lucide-react";
import { MarkdownPreview } from "@/components/MarkdownPreview";

/* ── Hero Sample Document ────────────────────────────────────────────────── */
const HERO_DOC = `# System Architecture Notes

## Privacy-First Security

Smart MD runs entirely in your browser memory. No data ever touches a remote server.

\`\`\`typescript
interface ClientVault {
  readonly id: string;
  readonly storageEngine: "IndexedDB";
  readonly encryption: "AES-GCM-256";
  readonly networkCalls: 0;
}
\`\`\`

## Core Capabilities

| Feature | Support | Engine |
|---|---|---|
| GFM Spec | Full | ReactMarkdown |
| Diagrams | Native | Mermaid.js |
| TeX Math | LaTeX | KaTeX |
| Encryption | Client-Side | Web Crypto API |

> "The ultimate privacy is having no backend at all."
`;

/* ── Live Interactive Demo Presets ───────────────────────────────────────── */
const DEMO_PRESETS = {
  documentation: `# Local-First Workspace

Write freely without tracking, telemetries, or mandatory cloud logins.

## Key Principles

- **Zero Cloud**: Your documents stay in browser storage (IndexedDB)
- **Portable**: Export to .md, PDF, Word, or Google Drive in 1 click
- **Encrypted**: Share passphrase-protected documents securely

\`\`\`bash
# Everything runs locally on your device
$ smart-md --offline --encrypted
\`\`\`
`,
  diagram: `# Architecture Flowchart

\`\`\`mermaid
graph TD
    A[Raw Markdown] -->|Local Parse| B(React-Markdown)
    B -->|KaTeX| C[Math Equations]
    B -->|Mermaid.js| D[Visual Diagrams]
    B -->|Prism.js| E[Syntax Highlighting]
    
    classDef mode fill:#18181b,stroke:#3b82f6,stroke-width:1.5px,color:#fafafa;
    class A,B,C,D,E mode;
\`\`\`
`,
  math: `# Quantum Physics Reference

The time-dependent Schrödinger equation:

$$i\\hbar \\frac{\\partial}{\\partial t} \\Psi(\\mathbf{r}, t) = \\hat{H} \\Psi(\\mathbf{r}, t)$$

## Fundamental Constants

| Constant | Symbol | Value |
|---|---|---|
| Planck Constant | $h$ | $6.626 \\times 10^{-34} \\text{ J}\\cdot\\text{s}$ |
| Speed of Light | $c$ | $2.998 \\times 10^8 \\text{ m/s}$ |
`,
} as const;
type DemoTab = keyof typeof DEMO_PRESETS;

/* ── Typewriter Manifesto Lines ───────────────────────────────────────────── */
const TYPEWRITER_LINES = [
  '# What does "local-first" actually mean?',
  "It means when you close this browser tab,\nyour document remains safely stored on your disk.",
  "It means if Smart MD goes offline tomorrow,\nyour files remain 100% accessible forever.",
  "It means zero servers, zero user tracking,\nand zero unauthorized data access.",
];

function useTypewriter(active: boolean) {
  const [output, setOutput] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [pausing, setPausing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active || done || pausing) return;
    const currentLine = TYPEWRITER_LINES[lineIdx];
    if (!currentLine) { setDone(true); return; }

    if (charIdx < currentLine.length) {
      const t = setTimeout(() => {
        setOutput(prev => prev + currentLine[charIdx]);
        setCharIdx(c => c + 1);
      }, 22);
      return () => clearTimeout(t);
    } else {
      if (lineIdx === TYPEWRITER_LINES.length - 1) { setDone(true); return; }
      setPausing(true);
      const t = setTimeout(() => {
        setOutput(prev => prev + "\n\n");
        setLineIdx(l => l + 1);
        setCharIdx(0);
        setPausing(false);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [active, charIdx, lineIdx, pausing, done]);

  return { output, done };
}

/* ── Props ───────────────────────────────────────────────────────────────── */
interface LandingHeroProps {
  onOpenFile: () => void;
  onPasteRender: (content: string, title?: string) => void;
  onCreateNew: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function LandingHero({ onOpenFile, onPasteRender, onCreateNew }: LandingHeroProps) {
  const [demoTab, setDemoTab] = useState<DemoTab>("documentation");
  const [demoContent, setDemoContent] = useState<string>(DEMO_PRESETS.documentation);
  const [hasTyped, setHasTyped] = useState(false);
  const [showZeroBytes, setShowZeroBytes] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [twActive, setTwActive] = useState(false);

  const dropRef = useRef<HTMLDivElement>(null);
  const twRef = useRef<HTMLDivElement>(null);

  const { output: twText } = useTypewriter(twActive);

  /* IntersectionObserver for typewriter activation */
  useEffect(() => {
    const el = twRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTwActive(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* Drag & Drop handlers */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget as Node)) setIsDragging(false);
  }, []);
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const valid = file.name.endsWith(".md") || file.name.endsWith(".markdown") || file.type === "text/markdown" || file.type === "text/plain";
    if (!valid) return;
    try { onPasteRender(await file.text(), file.name.replace(/\.md(?:own)?$/i, "") || undefined); }
    catch { /* ignore */ }
  }, [onPasteRender]);

  const handleDemoType = (val: string) => {
    setDemoContent(val);
    if (!hasTyped) {
      setHasTyped(true);
      setTimeout(() => setShowZeroBytes(true), 2500);
    }
  };

  const switchTab = (tab: DemoTab) => {
    setDemoTab(tab);
    setDemoContent(DEMO_PRESETS[tab]);
  };

  return (
    <div
      ref={dropRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="min-h-screen relative overflow-hidden bg-[#fafafa] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 transition-colors duration-200"
    >
      {/* ── Keyframes & Dynamic Light/Dark Styles ───────────────────────────── */}
      <style>{`
        @keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

        .animate-fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }

        .theme-card {
          background: #ffffff;
          border: 1px solid #e4e4e7;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }
        .dark .theme-card {
          background: #121215;
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
        }
        .theme-card:hover {
          border-color: #d4d4d8;
        }
        .dark .theme-card:hover {
          border-color: rgba(255, 255, 255, 0.16);
        }

        .primary-btn {
          background: #2563eb;
          color: #ffffff;
          font-weight: 600;
          font-size: 0.9375rem;
          padding: 0.7rem 1.6rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
          transition: all 0.15s ease;
        }
        .dark .primary-btn {
          background: #3b82f6;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
        }
        .primary-btn:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }
        .dark .primary-btn:hover {
          background: #2563eb;
          box-shadow: 0 0 25px rgba(59, 130, 246, 0.35);
        }
        .primary-btn:active { transform: translateY(0); }

        .secondary-btn {
          background: #ffffff;
          color: #18181b;
          border: 1px solid #e4e4e7;
          font-weight: 500;
          font-size: 0.9375rem;
          padding: 0.7rem 1.6rem;
          border-radius: 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.15s ease;
        }
        .dark .secondary-btn {
          background: rgba(255, 255, 255, 0.05);
          color: #fafafa;
          border-color: rgba(255, 255, 255, 0.08);
        }
        .secondary-btn:hover {
          background: #f4f4f5;
          border-color: #d4d4d8;
        }
        .dark .secondary-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.16);
        }

        .tab-btn {
          background: transparent;
          border: none;
          color: #71717a;
          font-size: 0.8125rem;
          font-weight: 500;
          padding: 10px 16px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.15s ease;
        }
        .dark .tab-btn { color: #a1a1aa; }
        .tab-btn.active {
          color: #09090b;
          border-bottom-color: #2563eb;
        }
        .dark .tab-btn.active {
          color: #ffffff;
          border-bottom-color: #3b82f6;
        }

        @media (max-width: 960px) {
          .hero-grid-split { grid-template-columns: 1fr !important; }
          .hero-preview-col { display: none !important; }
        }
        @media (max-width: 768px) {
          .demo-split-grid { grid-template-columns: 1fr !important; }
          .bento-grid-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Background Subtle Glow ─────────────────────────────────────────── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/10 dark:bg-blue-600/10 blur-[140px] pointer-events-none rounded-full" />

      {/* ── Drop Overlay ───────────────────────────────────────────────────── */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-md">
          <div className="theme-card p-12 flex flex-col items-center gap-4 text-center">
            <FileText size={48} className="text-blue-600 dark:text-blue-500 animate-bounce" />
            <p className="text-xl font-bold text-zinc-900 dark:text-white">Drop Markdown File</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Release to open and render locally</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          1. HERO SECTION (Linear Split View)
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 items-center min-h-[75vh] hero-grid-split">
          
          {/* Left Column: Value Proposition */}
          <div className="flex flex-col gap-6">
            
            {/* Eyebrow Badge */}
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                100% Private · Zero Cloud · Local First
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="animate-fade-up delay-1 text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-zinc-900 dark:text-white">
              Your writing.<br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-zinc-900 dark:from-blue-400 dark:via-indigo-300 dark:to-white bg-clip-text text-transparent">
                Nowhere else.
              </span>
            </h1>

            {/* Subheading */}
            <p className="animate-fade-up delay-2 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[48ch]">
              Smart MD is a standalone, local-first Markdown workspace that runs entirely inside your browser. No servers. No telemetry. Your files remain on your device.
            </p>

            {/* CTA Group */}
            <div className="animate-fade-up delay-3 flex items-center gap-4 pt-2 flex-wrap">
              <button className="primary-btn" onClick={onCreateNew}>
                Start Writing <ArrowRight size={16} />
              </button>
              <button className="secondary-btn" onClick={onOpenFile}>
                Open .md File
              </button>
            </div>

            {/* Quick Fact */}
            <p className="text-xs font-mono text-zinc-500 pt-2 flex items-center gap-2">
              <Shield size={14} className="text-emerald-500" />
              IndexedDB Storage · AES-GCM Encrypted Link Sharing
            </p>
          </div>

          {/* Right Column: Live App Screenshot / Panel */}
          <div className="hero-preview-col animate-fade-up delay-3">
            <div className="theme-card overflow-hidden">
              
              {/* Window Header */}
              <div className="px-4 py-3 bg-zinc-100 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  </div>
                  <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400 ml-2">architecture-notes.md</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  Local Memory
                </div>
              </div>

              {/* Rendered Preview */}
              <div className="p-6 max-h-[440px] overflow-y-auto bg-white dark:bg-transparent text-zinc-800 dark:text-zinc-200">
                <Suspense fallback={<div className="text-xs text-zinc-400 p-4">Loading preview...</div>}>
                  <MarkdownPreview content={HERO_DOC} showFrontmatter={false} />
                </Suspense>
              </div>

              {/* Footer Indicator */}
              <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950/40 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>● 0 network requests made</span>
                <span>GFM + KaTeX + Mermaid</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          2. TRUST STRIP
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="border-y border-zinc-200 dark:border-zinc-800/60 bg-zinc-100/60 dark:bg-zinc-950/50 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-x-12 gap-y-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {[
            "No Account Required",
            "100% Offline Capability",
            "Zero Cloud Tracking",
            "End-to-End Encrypted Link Sharing",
            "Free & Open Source Core",
          ].map(item => (
            <span key={item} className="flex items-center gap-2">
              <Check size={14} className="text-blue-600 dark:text-blue-400" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3. TYPEWRITER MANIFESTO
          ══════════════════════════════════════════════════════════════════════ */}
      <section ref={twRef} className="py-28 px-6">
        <div className="max-w-3xl mx-auto min-h-[220px]">
          <pre className="font-mono text-lg sm:text-xl text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
            {twText}
            <span className="inline-block w-2.5 h-5 bg-blue-600 dark:bg-blue-500 ml-1 align-middle animate-[cursorBlink_1s_infinite]" />
          </pre>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. FEATURE BENTO GRID
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="mb-16">
          <p className="text-xs font-mono uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2">Built for Developers & Writers</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Everything you need. Nothing you don't.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bento-grid-2col">
          
          {/* Card 1: GFM & Code */}
          <div className="theme-card p-8 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                <Code2 size={20} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Full GFM & Code Highlighting</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                Complete GitHub Flavored Markdown rendering with syntax highlighting for 50+ programming languages, task lists, tables, and footnotes.
              </p>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-zinc-800 dark:text-zinc-300">
              <span className="text-blue-600 dark:text-blue-400">const</span> workspace = <span className="text-emerald-600 dark:text-emerald-400">new</span> SmartMD({`{`} <span className="text-indigo-600 dark:text-indigo-300">offline</span>: <span className="text-amber-600 dark:text-amber-400">true</span> {`}`});
            </div>
          </div>

          {/* Card 2: Mermaid Diagrams */}
          <div className="theme-card p-8 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400">
                <Sparkles size={20} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Native Mermaid.js Diagrams</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                Render flowcharts, sequence diagrams, Gantt charts, and architecture maps inline directly from plain Markdown text.
              </p>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-600 dark:text-zinc-400">
              <span>\`\`\`mermaid graph TD\`\`\`</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-[11px] bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">Live Rendered</span>
            </div>
          </div>

          {/* Card 3: Encrypted Sharing */}
          <div className="theme-card p-8 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
                <Lock size={20} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">AES-GCM Encrypted Sharing</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                Share passphrase-protected URLs or exported <code className="font-mono text-zinc-800 dark:text-zinc-200">.smdshare</code> files. Decryption happens purely in client memory.
              </p>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-600 dark:text-zinc-400">Key: WebCrypto API</span>
              <span className="text-blue-600 dark:text-blue-400">AES-GCM-256</span>
            </div>
          </div>

          {/* Card 4: Multi-Format Export */}
          <div className="theme-card p-8 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400">
                <Download size={20} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Universal Export Options</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                Export your notes to clean Markdown, PDF, Word documents, or push directly to Google Docs & Google Drive without losing formatting.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[".md", ".pdf", ".docx", "Google Drive"].map(fmt => (
                <span key={fmt} className="bg-zinc-100 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded text-xs font-mono">
                  {fmt}
                </span>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          5. LIVE INLINE WORKSPACE DEMO
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2">Interactive Preview</p>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Test Smart MD directly in this page</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Type or modify the Markdown below. Rendering happens 100% locally in real time.</p>
        </div>

        <div className="theme-card overflow-hidden">
          {/* Preset Tabs */}
          <div className="bg-zinc-100/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4">
            {(["documentation", "diagram", "math"] as const).map(tab => (
              <button
                key={tab}
                className={`tab-btn ${demoTab === tab ? "active" : ""}`}
                onClick={() => switchTab(tab)}
              >
                {{ documentation: "Documentation", diagram: "Mermaid Diagram", math: "LaTeX Formulas" }[tab]}
              </button>
            ))}
          </div>

          {/* Split View */}
          <div className="grid grid-cols-1 md:grid-cols-2 demo-split-grid divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-800">
            {/* Editor Side */}
            <div className="p-4 bg-zinc-50/60 dark:bg-zinc-950/60">
              <div className="text-[11px] font-mono text-zinc-500 mb-2 flex items-center justify-between">
                <span>Input (Markdown)</span>
                <span>Editable</span>
              </div>
              <textarea
                value={demoContent}
                onChange={e => handleDemoType(e.target.value)}
                className="w-full min-h-[360px] bg-transparent text-xs font-mono text-zinc-800 dark:text-zinc-200 leading-relaxed resize-none focus:outline-none"
                spellCheck={false}
                placeholder="Type your markdown here..."
              />
            </div>

            {/* Preview Side */}
            <div className="p-6 max-h-[420px] overflow-y-auto bg-white dark:bg-zinc-900/30 text-zinc-800 dark:text-zinc-200">
              <div className="text-[11px] font-mono text-zinc-500 mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between">
                <span>Live Preview Output</span>
                <span className="text-emerald-600 dark:text-emerald-400">Local Render</span>
              </div>
              <Suspense fallback={<div className="text-xs text-zinc-400">Rendering preview...</div>}>
                <MarkdownPreview content={demoContent} showFrontmatter={false} />
              </Suspense>
            </div>
          </div>

          {/* Live Status Bar */}
          <div className="px-6 py-3 bg-zinc-100 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Offline Ready</span>
            </div>
            <span className={`text-emerald-600 dark:text-emerald-400 transition-opacity duration-500 ${showZeroBytes ? "opacity-100" : "opacity-0"}`}>
              0 bytes sent to any remote server
            </span>
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => onPasteRender(demoContent)}
            className="text-xs font-mono text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors underline underline-offset-4"
          >
            Open this snippet in full workspace →
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          6. PRIVACY GUARANTEE (Bold Typographic Statement)
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-28 px-6 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/40 dark:bg-zinc-950/40">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
            Smart MD has no servers.
          </h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-12 max-w-2xl mx-auto">
            There is nowhere to send your data. Our infrastructure is a static browser bundle.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left max-w-2xl mx-auto mb-12">
            <div className="theme-card p-6">
              <p className="font-semibold text-zinc-900 dark:text-white mb-2">Browser Storage</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Your notes are persisted in IndexedDB on your device. When you close the tab, your data remains safely stored locally.
              </p>
            </div>
            <div className="theme-card p-6">
              <p className="font-semibold text-zinc-900 dark:text-white mb-2">Client Encryption</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Encrypted share links encrypt the text in Web Crypto memory before generating a URL fragment. The key is in the hash (#).
              </p>
            </div>
          </div>

          <p className="text-xs font-mono text-zinc-500">
            Open DevTools → Network tab → verify zero outbound requests.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          7. FINALE & FOOTER
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-28 px-6 bg-zinc-900 dark:bg-black text-center border-t border-zinc-800 dark:border-zinc-900 text-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            Ready to write?
          </h2>
          <p className="text-zinc-400 mb-8">
            No signup. No account. Start in seconds.
          </p>
          <button className="primary-btn" onClick={onCreateNew}>
            Open Smart MD <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-zinc-800 dark:border-zinc-900 bg-zinc-950 dark:bg-black text-xs font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <p>Smart MD · Private Local-First Markdown Workspace</p>
          <p>Built in browser · Stored on device · Shared on your terms</p>
        </div>
      </footer>
    </div>
  );
}
