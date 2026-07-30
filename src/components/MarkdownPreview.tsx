import { lazy, Suspense, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkFrontmatter from "remark-frontmatter";
import rehypeKatex from "rehype-katex";
import { Copy } from "lucide-react";

const MermaidDiagram = lazy(() => import("@/components/MermaidDiagram"));
const SyntaxHighlighter = lazy(async () => {
  const [{ Prism }, styles] = await Promise.all([
    import("react-syntax-highlighter"),
    import("react-syntax-highlighter/dist/esm/styles/prism"),
  ]);

  return {
    default: ({ language, children }: { language: string; children: string }) => (
      <Prism style={styles.oneDark} language={language} PreTag="div">
        {children}
      </Prism>
    ),
  };
});

interface MarkdownPreviewProps {
  content: string;
}

const CodeFallback = ({ children }: { children: string }) => (
  <pre className="overflow-x-auto rounded-md bg-code-bg p-4 text-code-text">
    <code>{children}</code>
  </pre>
);

const MarkdownTable = ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => {
  const tableRef = useRef<HTMLTableElement>(null);

  const handleCopyCsv = () => {
    if (!tableRef.current) return;
    const rows = Array.from(tableRef.current.querySelectorAll("tr"));
    const csvContent = rows
      .map((row) =>
        Array.from(row.querySelectorAll("th, td"))
          .map((cell) => `"${cell.textContent?.replace(/"/g, '""').trim() || ""}"`)
          .join(",")
      )
      .join("\n");

    navigator.clipboard.writeText(csvContent);
  };

  return (
    <div className="group relative my-6 w-full overflow-x-auto rounded-lg border border-border">
      <button
        onClick={handleCopyCsv}
        className="absolute top-2 right-2 z-10 hidden group-hover:flex items-center gap-1 bg-background/90 backdrop-blur-sm border border-border text-xs px-2 py-1 rounded shadow-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
        title="Copy table data as CSV"
        aria-label="Copy table data as CSV"
      >
        <Copy className="w-3 h-3" />
        Copy CSV
      </button>
      <table ref={tableRef} className="w-full text-left text-sm" {...props}>
        {children}
      </table>
    </div>
  );
};

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="markdown-preview">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkFrontmatter]}
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
                  title="Direct link to section"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState(null, "", `#${id}`);
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
                  title="Direct link to section"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState(null, "", `#${id}`);
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
                  title="Direct link to section"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState(null, "", `#${id}`);
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
                NOTE: { border: "border-blue-500", bg: "bg-blue-500/10", text: "text-blue-500", label: "Note" },
                TIP: { border: "border-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Tip" },
                WARNING: { border: "border-amber-500", bg: "bg-amber-500/10", text: "text-amber-500", label: "Warning" },
                IMPORTANT: { border: "border-purple-500", bg: "bg-purple-500/10", text: "text-purple-500", label: "Important" },
                CAUTION: { border: "border-rose-500", bg: "bg-rose-500/10", text: "text-rose-500", label: "Caution" },
              }[type] || { border: "border-primary", bg: "bg-muted", text: "text-primary", label: type };

              // Clean [!NOTE] prefix from first paragraph child text
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
              return (
                <Suspense fallback={<CodeFallback>{source}</CodeFallback>}>
                  <SyntaxHighlighter language={language}>{source}</SyntaxHighlighter>
                </Suspense>
              );
            }

            return (
              <code className="bg-muted text-foreground/90 px-1.5 py-0.5 rounded font-mono text-sm border border-border/50" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
