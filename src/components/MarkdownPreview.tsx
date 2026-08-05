import { lazy, Suspense, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkFrontmatter from "remark-frontmatter";
import rehypeKatex from "rehype-katex";
import { Copy, Check, Maximize2, Minimize2 } from "lucide-react";

const MermaidDiagram = lazy(() => import("@/components/MermaidDiagram"));
const SyntaxHighlighter = lazy(async () => {
  const { Prism } = await import("react-syntax-highlighter");
  const { oneDark } = await import("react-syntax-highlighter/dist/esm/styles/prism");

  return {
    default: ({ language, children }: { language: string; children: string }) => (
      <Prism style={oneDark} language={language} PreTag="div">
        {children}
      </Prism>
    ),
  };
});

interface MarkdownPreviewProps {
  content: string;
  showFrontmatter?: boolean;
}

const CodeFallback = ({ children }: { children: string }) => (
  <pre className="overflow-x-auto rounded-md bg-code-bg p-4 text-code-text">
    <code>{children}</code>
  </pre>
);

// ── Code block wrapper with copy button ─────────────────────────────────────
const CodeBlock = ({ language, children }: { language: string; children: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="group relative my-4">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-background/90 backdrop-blur-sm border border-border text-xs px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150"
        title="Copy code"
        aria-label="Copy code to clipboard"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-500">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            Copy
          </>
        )}
      </button>
      <Suspense fallback={<CodeFallback>{children}</CodeFallback>}>
        <SyntaxHighlighter language={language}>{children}</SyntaxHighlighter>
      </Suspense>
    </div>
  );
};

// ── Table with CSV + Markdown export ────────────────────────────────────────
const MarkdownTable = ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const [copyMode, setCopyMode] = useState<"csv" | "md" | null>(null);

  const getCsvContent = () => {
    if (!tableRef.current) return "";
    const rows = Array.from(tableRef.current.querySelectorAll("tr"));
    return rows
      .map((row) =>
        Array.from(row.querySelectorAll("th, td"))
          .map((cell) => `"${cell.textContent?.replace(/"/g, '""').trim() || ""}"`)
          .join(",")
      )
      .join("\n");
  };

  const getMarkdownContent = () => {
    if (!tableRef.current) return "";
    const rows = Array.from(tableRef.current.querySelectorAll("tr"));
    const mdRows = rows.map((row) => {
      const cells = Array.from(row.querySelectorAll("th, td")).map(
        (cell) => cell.textContent?.trim() || ""
      );
      return "| " + cells.join(" | ") + " |";
    });
    // Insert separator after header row
    if (mdRows.length > 0) {
      const headerCells = Array.from(rows[0].querySelectorAll("th, td")).length;
      const separator = "| " + Array(headerCells).fill("---").join(" | ") + " |";
      mdRows.splice(1, 0, separator);
    }
    return mdRows.join("\n");
  };

  const handleCopyCsv = async () => {
    await navigator.clipboard.writeText(getCsvContent());
    setCopyMode("csv");
    setTimeout(() => setCopyMode(null), 2000);
  };

  const handleCopyMarkdown = async () => {
    await navigator.clipboard.writeText(getMarkdownContent());
    setCopyMode("md");
    setTimeout(() => setCopyMode(null), 2000);
  };

  return (
    <div className="group relative my-6 w-full overflow-x-auto rounded-lg border border-border">
      {/* Table action buttons */}
      <div className="absolute top-2 right-2 z-10 hidden group-hover:flex items-center gap-1">
        <button
          onClick={handleCopyCsv}
          className="flex items-center gap-1 bg-background/90 backdrop-blur-sm border border-border text-xs px-2 py-1 rounded shadow-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
          title="Copy table data as CSV"
          aria-label="Copy table data as CSV"
        >
          {copyMode === "csv" ? (
            <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500">CSV!</span></>
          ) : (
            <><Copy className="w-3 h-3" />CSV</>
          )}
        </button>
        <button
          onClick={handleCopyMarkdown}
          className="flex items-center gap-1 bg-background/90 backdrop-blur-sm border border-border text-xs px-2 py-1 rounded shadow-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
          title="Copy table as Markdown"
          aria-label="Copy table as Markdown"
        >
          {copyMode === "md" ? (
            <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500">MD!</span></>
          ) : (
            <><Copy className="w-3 h-3" />MD</>
          )}
        </button>
      </div>
      <table ref={tableRef} className="w-full text-left text-sm" {...props}>
        {children}
      </table>
    </div>
  );
};

export function MarkdownPreview({ content, showFrontmatter = false }: MarkdownPreviewProps) {
  // Strip YAML frontmatter when showFrontmatter is false
  const displayContent = showFrontmatter
    ? content
    : content.replace(/^---\n[\s\S]*?\n---\n?/, "");

  return (
    <div className="markdown-preview">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, [remarkFrontmatter, { type: "yaml", marker: "-" }]]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1({ children, ...props }) {
            const text = String(children).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/`([^`]+)`/g, "$1");
            const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
            return (
              <h1 id={id} className="group relative flex items-center" {...props}>
                <span>{children}</span>
                <a
                  href={`#${id}`}
                  className="ml-2 text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity text-lg"
                  title="Direct link to section"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState(null, "", `#${id}`);
                    navigator.clipboard.writeText(window.location.href.split('#')[0] + `#${id}`);
                    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  #
                </a>
              </h1>
            );
          },
          h2({ children, ...props }) {
            const text = String(children).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/`([^`]+)`/g, "$1");
            const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
            return (
              <h2 id={id} className="group relative flex items-center" {...props}>
                <span>{children}</span>
                <a
                  href={`#${id}`}
                  className="ml-2 text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity text-base"
                  title="Copy link to section"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState(null, "", `#${id}`);
                    navigator.clipboard.writeText(window.location.href.split('#')[0] + `#${id}`);
                    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  #
                </a>
              </h2>
            );
          },
          h3({ children, ...props }) {
            const text = String(children).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/`([^`]+)`/g, "$1");
            const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
            return (
              <h3 id={id} className="group relative flex items-center" {...props}>
                <span>{children}</span>
                <a
                  href={`#${id}`}
                  className="ml-2 text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity text-sm"
                  title="Copy link to section"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState(null, "", `#${id}`);
                    navigator.clipboard.writeText(window.location.href.split('#')[0] + `#${id}`);
                    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  #
                </a>
              </h3>
            );
          },
          h4({ children, ...props }) {
            const text = String(children).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/`([^`]+)`/g, "$1");
            const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
            return (
              <h4 id={id} className="group relative flex items-center" {...props}>
                <span>{children}</span>
                <a
                  href={`#${id}`}
                  className="ml-2 text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity text-xs"
                  title="Copy link to section"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState(null, "", `#${id}`);
                    navigator.clipboard.writeText(window.location.href.split('#')[0] + `#${id}`);
                    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  #
                </a>
              </h4>
            );
          },
          blockquote({ children, ...props }) {
            const childrenArray = Array.isArray(children) ? children : [children];
            let rawText = "";

            try {
              const firstChild = childrenArray[0];
              if (firstChild?.props?.children) {
                const subChildren = Array.isArray(firstChild.props.children)
                  ? firstChild.props.children
                  : [firstChild.props.children];
                rawText = String(subChildren[0] || "");
              } else {
                rawText = String(firstChild || "");
              }
            } catch (e) {
              rawText = "";
            }

            const match = rawText.trim().match(/^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]/i);

            if (match) {
              const type = match[1].toUpperCase();
              const config = {
                NOTE: { border: "border-blue-500", bg: "bg-blue-500/10", text: "text-blue-500", label: "Note", icon: "ℹ️" },
                TIP: { border: "border-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Tip", icon: "💡" },
                WARNING: { border: "border-amber-500", bg: "bg-amber-500/10", text: "text-amber-500", label: "Warning", icon: "⚠️" },
                IMPORTANT: { border: "border-purple-500", bg: "bg-purple-500/10", text: "text-purple-500", label: "Important", icon: "❗" },
                CAUTION: { border: "border-rose-500", bg: "bg-rose-500/10", text: "text-rose-500", label: "Caution", icon: "🔴" },
              }[type] || { border: "border-primary", bg: "bg-muted", text: "text-primary", label: type, icon: "•" };

              const cleanedChildren = Array.isArray(children)
                ? children.map((child, idx) => {
                    if (idx === 0 && child && typeof child === "object" && "props" in child) {
                      const pChildren = child.props.children;
                      if (Array.isArray(pChildren) && typeof pChildren[0] === "string") {
                        const cleanedText = pChildren[0].replace(/^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]/i, "").trimStart();
                        return { ...child, props: { ...child.props, children: [cleanedText, ...pChildren.slice(1)] } };
                      }
                    }
                    return child;
                  })
                : children;

              return (
                <div className={`my-4 border-l-4 ${config.border} ${config.bg} p-4 rounded-r-md text-sm shadow-sm`}>
                  <div className={`font-bold ${config.text} mb-1.5 tracking-wide text-xs uppercase flex items-center gap-1.5`}>
                    <span>{config.icon}</span>
                    {config.label}
                  </div>
                  <div className="text-foreground/90 leading-relaxed">{cleanedChildren}</div>
                </div>
              );
            }

            return <blockquote className="border-l-4 border-muted-foreground/30 pl-4 my-4 italic text-muted-foreground" {...props}>{children}</blockquote>;
          },
          table: MarkdownTable,
          code({ children, className, ...props }) {
            const language = /language-([\w-]+)/.exec(className || "")?.[1];
            const source = String(children).replace(/\n$/, "");

            if (language === "mermaid") {
              return (
                <Suspense fallback={<CodeFallback>{source}</CodeFallback>}>
                  <MermaidDiagram chart={source} />
                </Suspense>
              );
            }

            if (language) {
              return <CodeBlock language={language}>{source}</CodeBlock>;
            }

            return (
              <code className="bg-muted text-foreground/90 px-1.5 py-0.5 rounded font-mono text-sm border border-border/50" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {displayContent}
      </ReactMarkdown>
    </div>
  );
}
