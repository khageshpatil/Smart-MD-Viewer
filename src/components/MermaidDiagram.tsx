import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MermaidDiagramProps {
  chart: string;
}

const MermaidDiagram = ({ chart }: MermaidDiagramProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);
  const [scale, setScale] = useState(1);

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

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setScale(1);

  return (
    <div className="mermaid-container group relative my-6 flex flex-col items-center bg-card border border-border rounded-lg p-4">
      {/* Zoom controls bar */}
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
  );
};

export default MermaidDiagram;
