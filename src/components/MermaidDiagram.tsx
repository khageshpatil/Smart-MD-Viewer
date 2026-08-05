import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MermaidDiagramProps {
  chart: string;
}

const MermaidDiagram = ({ chart }: MermaidDiagramProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: "neutral",
        securityLevel: "loose",
      });
    } catch {
      // Ignore re-initialization warnings
    }

    if (elementRef.current) {
      elementRef.current.innerHTML = chart;
      elementRef.current.removeAttribute('data-processed');
      
      mermaid.run({
        nodes: [elementRef.current],
      }).catch((error) => {
        console.error('Mermaid rendering error:', error);
        if (elementRef.current) {
          elementRef.current.innerHTML = `<pre class="text-destructive">Error rendering diagram: ${error.message}</pre>`;
        }
      });
    }
  }, [chart]);

  // Render fullscreen version when entering fullscreen
  useEffect(() => {
    if (isFullscreen && fullscreenRef.current) {
      fullscreenRef.current.innerHTML = chart;
      fullscreenRef.current.removeAttribute('data-processed');
      mermaid.run({ nodes: [fullscreenRef.current] }).catch(() => {});
    }
  }, [isFullscreen, chart]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.25));
  const handleResetZoom = () => setScale(1);

  return (
    <>
      {/* Inline diagram */}
      <div className="mermaid-container group relative my-6 flex flex-col items-center bg-card border border-border rounded-lg p-4">
        {/* Controls bar */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm border border-border rounded-md p-1 opacity-60 group-hover:opacity-100 transition-opacity z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleZoomIn}
            title="Zoom In"
            aria-label="Zoom in diagram"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom out diagram"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleResetZoom}
            title="Reset Zoom"
            aria-label="Reset diagram zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
          <span className="text-[10px] text-muted-foreground px-1 font-mono">{Math.round(scale * 100)}%</span>
          <div className="w-px h-4 bg-border mx-0.5" />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => setIsFullscreen(true)}
            title="Fullscreen"
            aria-label="View diagram fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="w-full overflow-auto flex justify-center py-2">
          <div
            ref={elementRef}
            id={idRef.current}
            className="mermaid transition-transform duration-150 origin-center"
            style={{ transform: `scale(${scale})` }}
          />
        </div>
      </div>

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setIsFullscreen(false); }}
        >
          {/* Fullscreen toolbar */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(false)}
              className="gap-1.5"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              Exit Fullscreen
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(false)}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Fullscreen diagram */}
          <div className="w-full h-full overflow-auto flex items-center justify-center p-8">
            <div
              ref={fullscreenRef}
              className="mermaid"
            />
          </div>

          <p className="absolute bottom-4 text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono">Esc</kbd> to exit
          </p>
        </div>
      )}
    </>
  );
};

export default MermaidDiagram;
