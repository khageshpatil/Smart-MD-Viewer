import { useEffect, useRef } from "react";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  chart: string;
}

const MermaidDiagram = ({ chart }: MermaidDiagramProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
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

  return (
    <div className="mermaid-container my-6 flex justify-center">
      <div ref={elementRef} id={idRef.current} className="mermaid" />
    </div>
  );
};

export default MermaidDiagram;
