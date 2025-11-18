import { useState, useCallback, useEffect, useRef } from "react";
import { Network, Download, FileText, Save, Trash2, Keyboard, ZoomIn, ZoomOut, Maximize2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import mermaid from "mermaid";

interface MermaidSandboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DIAGRAM_TEMPLATES = {
  flowchart: {
    name: "Flowchart",
    code: `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`
  },
  sequence: {
    name: "Sequence Diagram",
    code: `sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    
    User->>Frontend: Request Data
    Frontend->>Backend: API Call
    Backend->>Database: Query
    Database-->>Backend: Results
    Backend-->>Frontend: Response
    Frontend-->>User: Display Data`
  },
  class: {
    name: "Class Diagram",
    code: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
        +eat()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +String color
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat`
  },
  er: {
    name: "ER Diagram",
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER {
        string name
        string email
        string phone
    }
    ORDER ||--|{ LINE-ITEM : contains
    ORDER {
        int orderNumber
        date orderDate
        string status
    }
    PRODUCT ||--o{ LINE-ITEM : includes
    PRODUCT {
        string name
        float price
        string category
    }
    LINE-ITEM {
        int quantity
        float total
    }`
  },
  gantt: {
    name: "Gantt Chart",
    code: `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Planning
    Research           :a1, 2024-01-01, 30d
    Requirements       :a2, after a1, 20d
    section Development
    Design             :a3, after a2, 25d
    Implementation     :a4, after a3, 60d
    Testing            :a5, after a4, 30d
    section Deployment
    Launch             :a6, after a5, 10d`
  },
  pie: {
    name: "Pie Chart",
    code: `pie title Market Share
    "Product A" : 45
    "Product B" : 25
    "Product C" : 20
    "Product D" : 10`
  }
};

const DEFAULT_MERMAID_CODE = DIAGRAM_TEMPLATES.flowchart.code;
const STORAGE_KEY = "mermaid-saved-templates";

interface SavedTemplate {
  id: string;
  name: string;
  code: string;
  createdAt: number;
}

export function MermaidSandbox({ open, onOpenChange }: MermaidSandboxProps) {
  const [code, setCode] = useState(DEFAULT_MERMAID_CODE);
  const [svgContent, setSvgContent] = useState("");
  const [error, setError] = useState("");
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [saveName, setSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isPanning, setIsPanning] = useState(false);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const { theme } = useTheme();
  const previewRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved templates from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedTemplates(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load saved templates:", e);
      }
    }
  }, []);

  // Initialize Mermaid with theme
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === "dark" ? "dark" : "default",
      themeVariables: theme === "dark" ? {
        primaryColor: "#3B82F6",
        primaryTextColor: "#000",
        primaryBorderColor: "#2563EB",
        lineColor: "#9CA3AF",
        secondaryColor: "#EC4899",
        tertiaryColor: "#10B981",
      } : {
        primaryColor: "#2563EB",
        primaryTextColor: "#fff",
        primaryBorderColor: "#1D4ED8",
        lineColor: "#6B7280",
        secondaryColor: "#EC4899",
        tertiaryColor: "#10B981",
      },
    });
  }, [theme]);

  // Save current diagram as template
  const saveTemplate = useCallback(() => {
    if (!saveName.trim() || !code.trim()) return;

    const newTemplate: SavedTemplate = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: saveName.trim(),
      code: code,
      createdAt: Date.now(),
    };

    const updated = [...savedTemplates, newTemplate];
    setSavedTemplates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSaveName("");
    setShowSaveInput(false);
  }, [saveName, code, savedTemplates]);

  // Load a saved template
  const loadTemplate = useCallback((template: SavedTemplate) => {
    setCode(template.code);
  }, []);

  // Delete a saved template
  const deleteTemplate = useCallback((id: string) => {
    const updated = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [savedTemplates]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S: Save template
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!showSaveInput) {
          setShowSaveInput(true);
        }
      }

      // Ctrl+E or Cmd+E: Export as PNG
      if ((e.ctrlKey || e.metaKey) && e.key === 'e' && !e.shiftKey) {
        e.preventDefault();
        exportAsPNG();
      }

      // Ctrl+Shift+E or Cmd+Shift+E: Export as JPG
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        exportAsJPG();
      }

      // Ctrl+/ or Cmd+/: Show shortcuts help
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcutsHelp(true);
      }

      // Escape: Close help modal
      if (e.key === 'Escape' && showShortcutsHelp) {
        setShowShortcutsHelp(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, showSaveInput, showShortcutsHelp]);

  // Render Mermaid diagram
  const renderDiagram = useCallback(async (mermaidCode: string) => {
    if (!mermaidCode.trim()) {
      setSvgContent("");
      setError("");
      return;
    }

    try {
      // Clear any existing content
      if (previewRef.current) {
        previewRef.current.innerHTML = "";
      }

      // Generate unique ID for this render
      const id = `mermaid-${Date.now()}`;
      
      // Render the diagram
      const { svg } = await mermaid.render(id, mermaidCode);
      setSvgContent(svg);
      setError("");

      // Insert into preview
      if (previewRef.current) {
        previewRef.current.innerHTML = svg;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to render diagram");
      setSvgContent("");
    }
  }, []);

  // Debounced render on code change
  useEffect(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    renderTimeoutRef.current = setTimeout(() => {
      renderDiagram(code);
    }, 500);

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [code, renderDiagram]);

  // Re-render when theme changes
  useEffect(() => {
    if (open && code.trim()) {
      renderDiagram(code);
    }
  }, [theme, open, code, renderDiagram]);

  // Initial render
  useEffect(() => {
    if (open) {
      renderDiagram(code);
    }
  }, [open, code, renderDiagram]);

  // Export as PNG
  const exportAsPNG = useCallback(async () => {
    if (!svgContent || !previewRef.current) return;

    try {
      const svgElement = previewRef.current.querySelector("svg");
      if (!svgElement) {
        alert("No diagram to export. Please create a diagram first.");
        return;
      }

      // Clone the SVG to avoid modifying the original
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      
      // Get actual dimensions from viewBox or width/height attributes
      const viewBox = clonedSvg.getAttribute("viewBox");
      let width = 800;
      let height = 600;
      
      if (viewBox) {
        const [, , w, h] = viewBox.split(" ").map(Number);
        width = w || width;
        height = h || height;
      } else {
        width = parseFloat(clonedSvg.getAttribute("width") || "800");
        height = parseFloat(clonedSvg.getAttribute("height") || "600");
      }

      // Ensure SVG has proper dimensions set
      clonedSvg.setAttribute("width", String(width));
      clonedSvg.setAttribute("height", String(height));
      
      // Add white background if not present
      const hasBackground = clonedSvg.querySelector("rect[fill='#ffffff']") || 
                           clonedSvg.querySelector("rect[fill='white']");
      if (!hasBackground) {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("width", "100%");
        rect.setAttribute("height", "100%");
        rect.setAttribute("fill", "white");
        clonedSvg.insertBefore(rect, clonedSvg.firstChild);
      }

      // Convert SVG to data URI (avoids CORS issues)
      const svgString = new XMLSerializer().serializeToString(clonedSvg);
      const svgBase64 = btoa(unescape(encodeURIComponent(svgString)));
      const dataUri = `data:image/svg+xml;base64,${svgBase64}`;

      // Create canvas with proper dimensions
      const canvas = document.createElement("canvas");
      const scale = 2; // Higher resolution
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        alert("Failed to create canvas context");
        return;
      }

      // Load and draw image
      const img = new Image();
      
      img.onload = () => {
        // Draw white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the SVG
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to PNG and download
        canvas.toBlob((blob) => {
          if (blob) {
            const downloadLink = document.createElement("a");
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = `diagram-${Date.now()}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(downloadLink.href);
          }
        }, "image/png");
      };

      img.onerror = () => {
        alert("Failed to load diagram for export. Please try again.");
      };

      img.src = dataUri;
    } catch (err) {
      console.error("Failed to export PNG:", err);
      alert("Failed to export diagram as PNG. Please try again.");
    }
  }, [svgContent]);

  // Export as JPG
  const exportAsJPG = useCallback(async () => {
    if (!svgContent || !previewRef.current) return;

    try {
      const svgElement = previewRef.current.querySelector("svg");
      if (!svgElement) {
        alert("No diagram to export. Please create a diagram first.");
        return;
      }

      // Clone the SVG to avoid modifying the original
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      
      // Get actual dimensions from viewBox or width/height attributes
      const viewBox = clonedSvg.getAttribute("viewBox");
      let width = 800;
      let height = 600;
      
      if (viewBox) {
        const [, , w, h] = viewBox.split(" ").map(Number);
        width = w || width;
        height = h || height;
      } else {
        width = parseFloat(clonedSvg.getAttribute("width") || "800");
        height = parseFloat(clonedSvg.getAttribute("height") || "600");
      }

      // Ensure SVG has proper dimensions set
      clonedSvg.setAttribute("width", String(width));
      clonedSvg.setAttribute("height", String(height));
      
      // Add white background if not present
      const hasBackground = clonedSvg.querySelector("rect[fill='#ffffff']") || 
                           clonedSvg.querySelector("rect[fill='white']");
      if (!hasBackground) {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("width", "100%");
        rect.setAttribute("height", "100%");
        rect.setAttribute("fill", "white");
        clonedSvg.insertBefore(rect, clonedSvg.firstChild);
      }

      // Convert SVG to data URI (avoids CORS issues)
      const svgString = new XMLSerializer().serializeToString(clonedSvg);
      const svgBase64 = btoa(unescape(encodeURIComponent(svgString)));
      const dataUri = `data:image/svg+xml;base64,${svgBase64}`;

      // Create canvas with proper dimensions
      const canvas = document.createElement("canvas");
      const scale = 2; // Higher resolution
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        alert("Failed to create canvas context");
        return;
      }

      // Load and draw image
      const img = new Image();
      
      img.onload = () => {
        // Draw white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the SVG
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to JPG and download
        canvas.toBlob((blob) => {
          if (blob) {
            const downloadLink = document.createElement("a");
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = `diagram-${Date.now()}.jpg`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(downloadLink.href);
          }
        }, "image/jpeg", 0.95);
      };

      img.onerror = () => {
        alert("Failed to load diagram for export. Please try again.");
      };

      img.src = dataUri;
    } catch (err) {
      console.error("Failed to export JPG:", err);
      alert("Failed to export diagram as JPG. Please try again.");
    }
  }, [svgContent]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] h-[90vh] w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                Mermaid Diagram Editor
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShortcutsHelp(true)}
                className="h-8"
              >
                <Keyboard className="w-4 h-4 mr-2" />
                Shortcuts
              </Button>
            </DialogTitle>
            <DialogDescription>
              Professional diagram viewer and editor with zoom, pan, and export capabilities
            </DialogDescription>
          </DialogHeader>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Left Sidebar: Saved Templates */}
          <div className="w-64 flex flex-col border-r border-border pr-4">
            <div className="mb-2 text-sm font-medium text-muted-foreground">
              Saved Templates
            </div>
            <ScrollArea className="flex-1 border border-border rounded-md p-2 bg-muted/30">
              {savedTemplates.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  No saved templates yet
                </div>
              ) : (
                <div className="space-y-2">
                  {savedTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="group flex items-center justify-between gap-2 p-2 rounded-md hover:bg-background border border-border/50"
                    >
                      <button
                        onClick={() => loadTemplate(template)}
                        className="flex-1 text-left text-xs font-medium truncate hover:text-primary"
                        title={template.name}
                      >
                        {template.name}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="mt-2 space-y-2">
              {showSaveInput ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Template name"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveTemplate();
                      if (e.key === "Escape") {
                        setShowSaveInput(false);
                        setSaveName("");
                      }
                    }}
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={saveTemplate}
                      disabled={!saveName.trim()}
                      className="flex-1 h-7"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowSaveInput(false);
                        setSaveName("");
                      }}
                      className="flex-1 h-7"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSaveInput(true)}
                  className="w-full"
                  disabled={!code.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Current
                </Button>
              )}
            </div>
          </div>

          {/* Middle Panel: Code Editor */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">
                Mermaid Code
              </div>
              <Select
                value={Object.keys(DIAGRAM_TEMPLATES).find(
                  key => DIAGRAM_TEMPLATES[key as keyof typeof DIAGRAM_TEMPLATES].code === code
                ) || "custom"}
                onValueChange={(value) => {
                  if (value !== "custom") {
                    setCode(DIAGRAM_TEMPLATES[value as keyof typeof DIAGRAM_TEMPLATES].code);
                  }
                }}
              >
                <SelectTrigger className="w-[180px] h-8 bg-background">
                  <FileText className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-50">
                  {Object.entries(DIAGRAM_TEMPLATES).map(([key, template]) => (
                    <SelectItem key={key} value={key} className="cursor-pointer">
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 font-mono text-sm resize-none"
              placeholder="Type your Mermaid diagram code here..."
            />
          </div>

          {/* Right Panel: Preview */}
          <div className="flex-1 flex flex-col min-w-0 border-l border-border pl-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-muted-foreground">
                  Preview
                </div>
                <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setZoomLevel(Math.max(25, zoomLevel - 25))}
                    disabled={zoomLevel <= 25}
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </Button>
                  <span className="text-xs font-mono min-w-[3rem] text-center">{zoomLevel}%</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
                    disabled={zoomLevel >= 200}
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </Button>
                  <div className="h-4 w-px bg-border mx-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setZoomLevel(100);
                      setPanPosition({ x: 0, y: 0 });
                    }}
                    title="Reset View"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setZoomLevel(100);
                      if (previewContainerRef.current) {
                        previewContainerRef.current.requestFullscreen?.();
                      }
                    }}
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportAsPNG}
                  disabled={!svgContent}
                >
                  <Download className="w-4 h-4 mr-2" />
                  PNG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportAsJPG}
                  disabled={!svgContent}
                >
                  <Download className="w-4 h-4 mr-2" />
                  JPG
                </Button>
              </div>
            </div>
            <div 
              ref={previewContainerRef}
              className="flex-1 border border-border rounded-md overflow-hidden bg-muted/30 relative"
              onMouseDown={(e) => {
                if (e.button === 0) {
                  setIsPanning(true);
                  setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
                }
              }}
              onMouseMove={(e) => {
                if (isPanning) {
                  setPanPosition({
                    x: e.clientX - panStart.x,
                    y: e.clientY - panStart.y
                  });
                }
              }}
              onMouseUp={() => setIsPanning(false)}
              onMouseLeave={() => setIsPanning(false)}
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -10 : 10;
                setZoomLevel(prev => Math.max(25, Math.min(200, prev + delta)));
              }}
              style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
            >
              <div 
                className="absolute inset-0 flex items-center justify-center p-4"
                style={{
                  transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel / 100})`,
                  transformOrigin: 'center center',
                  transition: isPanning ? 'none' : 'transform 0.2s ease-out'
                }}
              >
                {error ? (
                  <div className="text-destructive text-sm">
                    <p className="font-semibold mb-2">Error rendering diagram:</p>
                    <pre className="text-xs">{error}</pre>
                  </div>
                ) : (
                  <div ref={previewRef} className="mermaid-preview" />
                )}
              </div>
              {!error && svgContent && (
                <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                  💡 Drag to pan, scroll to zoom
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Keyboard Shortcuts Help Modal */}
    <Dialog open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to work faster
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            <ShortcutItem 
              keys={["Ctrl", "S"]} 
              description="Save current diagram as template" 
            />
            <ShortcutItem 
              keys={["Ctrl", "E"]} 
              description="Export diagram as PNG" 
            />
            <ShortcutItem 
              keys={["Ctrl", "Shift", "E"]} 
              description="Export diagram as JPG" 
            />
            <ShortcutItem 
              keys={["Ctrl", "/"]} 
              description="Show keyboard shortcuts" 
            />
            <ShortcutItem 
              keys={["Esc"]} 
              description="Close modals or cancel actions" 
            />
          </div>
          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            Note: Use <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded">Cmd</kbd> instead of <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded">Ctrl</kbd> on Mac
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

// Helper component for shortcut items
interface ShortcutItemProps {
  keys: string[];
  description: string;
}

function ShortcutItem({ keys, description }: ShortcutItemProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-foreground">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <span key={index} className="flex items-center">
            <Badge variant="outline" className="font-mono text-xs px-2 py-1">
              {key}
            </Badge>
            {index < keys.length - 1 && (
              <span className="mx-1 text-muted-foreground">+</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
