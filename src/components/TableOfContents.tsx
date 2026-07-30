import { useState, useEffect } from "react";
import { AlignLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function extractHeadings(markdown: string): TocItem[] {
  if (!markdown) return [];
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const rawText = match[2].trim();
    // Clean inline markdown links/code from heading text for display
    const text = rawText.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/`([^`]+)`/g, "$1");
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    headings.push({ id, text, level });
  }

  return headings;
}

interface TableOfContentsProps {
  markdown: string;
  onClose?: () => void;
}

export function TableOfContents({ markdown, onClose }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const headings = extractHeadings(markdown);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -80% 0px", threshold: 0.1 }
    );

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleScrollTo = (id: string) => {
    setActiveId(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (headings.length === 0) {
    return (
      <div className="w-64 border-l border-border bg-card p-4 text-sm text-muted-foreground flex flex-col justify-between">
        <div className="flex items-center justify-between font-medium text-foreground mb-3">
          <div className="flex items-center gap-2">
            <AlignLeft className="w-4 h-4 text-primary" />
            Table of Contents
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="text-xs text-muted-foreground italic py-8 text-center">
          No headings found in this document. Add # H1, ## H2 tags to generate an outline.
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 border-l border-border bg-card/95 backdrop-blur-sm p-4 flex flex-col h-full select-none">
      <div className="flex items-center justify-between font-semibold text-sm text-foreground mb-3 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <AlignLeft className="w-4 h-4 text-primary" />
          Table of Contents
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 pr-2">
        <nav className="space-y-1 py-1">
          {headings.map((item, index) => {
            const isActive = activeId === item.id;
            const indentClass =
              item.level === 1
                ? "pl-2 font-medium text-foreground"
                : item.level === 2
                ? "pl-5 text-muted-foreground"
                : item.level === 3
                ? "pl-8 text-muted-foreground/80 text-xs"
                : "pl-11 text-muted-foreground/70 text-xs";

            return (
              <button
                key={`${item.id}-${index}`}
                onClick={() => handleScrollTo(item.id)}
                className={`w-full text-left py-1 px-2 rounded-md text-xs transition-colors duration-150 truncate block hover:bg-muted ${indentClass} ${
                  isActive ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary" : ""
                }`}
                title={item.text}
              >
                {item.text}
              </button>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}
