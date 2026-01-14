import { useState, useCallback, useEffect, useRef } from "react";
import { FileText, Eye, Code, Download, Network, Archive, Upload, Menu, Kanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import mermaid from "mermaid";
import MermaidDiagram from "@/components/MermaidDiagram";
import { MermaidSandbox } from "@/components/MermaidSandbox";
import { DocumentSidebar } from "@/components/DocumentSidebar";
import {
  Document,
  Folder,
  initDB,
  saveDocument,
  getDocument,
  deleteDocument,
  saveFolder,
  getFolder,
  deleteFolder,
  exportWorkspace,
  importWorkspace,
} from "@/lib/indexedDB";
import JSZip from "jszip";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const Index = () => {
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "code" | "split">("split");
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const mermaidInitialized = useRef(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [refreshSidebar, setRefreshSidebar] = useState(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Initialize mermaid and IndexedDB
  useEffect(() => {
    if (!mermaidInitialized.current) {
      mermaid.initialize({
        startOnLoad: true,
        theme: "neutral",
        securityLevel: "loose",
      });
      mermaidInitialized.current = true;
    }
    initDB();
  }, []);

  // Auto-save with debounce
  const autoSave = useCallback((doc: Document) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      await saveDocument(doc);
      setRefreshSidebar((prev) => prev + 1);
    }, 500);
  }, []);

  const handleDocumentSelect = async (doc: Document) => {
    setActiveDocument(doc);
    setViewMode("split");
  };

  const handleNewDocument = async (folderId: string | null) => {
    const newDoc: Document = {
      id: `doc-${Date.now()}-${Math.random()}`,
      title: "Untitled Document",
      content: "",
      folderId,
      tags: [],
      isPinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveDocument(newDoc);
    setActiveDocument(newDoc);
    setViewMode("split");
    setRefreshSidebar((prev) => prev + 1);
    
    // Focus title input after a short delay
    setTimeout(() => {
      titleInputRef.current?.select();
    }, 100);
  };

  const handleDeleteDocument = async (docId: string) => {
    await deleteDocument(docId);
    if (activeDocument?.id === docId) {
      setActiveDocument(null);
    }
    setRefreshSidebar((prev) => prev + 1);
    toast({
      title: "Document deleted",
      description: "The document has been removed from your workspace.",
    });
  };

  const handleRenameDocument = async (docId: string, newTitle: string) => {
    const doc = await getDocument(docId);
    if (doc) {
      const updated = { ...doc, title: newTitle.trim() || "Untitled", updatedAt: Date.now() };
      await saveDocument(updated);
      if (activeDocument?.id === docId) {
        setActiveDocument(updated);
      }
      setRefreshSidebar((prev) => prev + 1);
    }
  };

  const handleTogglePin = async (docId: string) => {
    const doc = await getDocument(docId);
    if (doc) {
      const updated = { ...doc, isPinned: !doc.isPinned, updatedAt: Date.now() };
      await saveDocument(updated);
      if (activeDocument?.id === docId) {
        setActiveDocument(updated);
      }
      setRefreshSidebar((prev) => prev + 1);
    }
  };

  const handleAddTag = async (docId: string) => {
    setEditingDocId(docId);
    setTagDialogOpen(true);
  };

  const handleSaveTag = async () => {
    if (!editingDocId || !newTag.trim()) return;
    
    const doc = await getDocument(editingDocId);
    if (doc) {
      const tag = newTag.trim().toLowerCase();
      if (!doc.tags.includes(tag)) {
        const updated = { ...doc, tags: [...doc.tags, tag], updatedAt: Date.now() };
        await saveDocument(updated);
        if (activeDocument?.id === editingDocId) {
          setActiveDocument(updated);
        }
        setRefreshSidebar((prev) => prev + 1);
      }
    }
    setNewTag("");
    setTagDialogOpen(false);
    setEditingDocId(null);
  };

  const handleRemoveTag = async (tag: string) => {
    if (!activeDocument) return;
    const updated = {
      ...activeDocument,
      tags: activeDocument.tags.filter((t) => t !== tag),
      updatedAt: Date.now(),
    };
    await saveDocument(updated);
    setActiveDocument(updated);
    setRefreshSidebar((prev) => prev + 1);
  };

  const handleMoveDocument = async (docId: string, folderId: string | null) => {
    const doc = await getDocument(docId);
    if (doc) {
      const updated = { ...doc, folderId, updatedAt: Date.now() };
      await saveDocument(updated);
      if (activeDocument?.id === docId) {
        setActiveDocument(updated);
      }
      setRefreshSidebar((prev) => prev + 1);
    }
  };

  const handleCreateFolder = async (parentId: string | null) => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}-${Math.random()}`,
      name: "New Folder",
      parentId,
      createdAt: Date.now(),
    };
    await saveFolder(newFolder);
    setRefreshSidebar((prev) => prev + 1);
  };

  const handleDeleteFolder = async (folderId: string) => {
    // Note: In production, you'd want to handle documents in the folder
    await deleteFolder(folderId);
    setRefreshSidebar((prev) => prev + 1);
    toast({
      title: "Folder deleted",
      description: "The folder has been removed.",
    });
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    const folder = await getFolder(folderId);
    if (folder) {
      const updated = { ...folder, name: newName.trim() || "Unnamed Folder" };
      await saveFolder(updated);
      setRefreshSidebar((prev) => prev + 1);
    }
  };

  const updateDocumentTitle = (newTitle: string) => {
    if (!activeDocument) return;
    const updated = { ...activeDocument, title: newTitle, updatedAt: Date.now() };
    setActiveDocument(updated);
    autoSave(updated);
  };

  const updateDocumentContent = (newContent: string) => {
    if (!activeDocument) return;
    const updated = { ...activeDocument, content: newContent, updatedAt: Date.now() };
    setActiveDocument(updated);
    autoSave(updated);
  };

  const toggleViewMode = () => {
    if (viewMode === "code") setViewMode("preview");
    else if (viewMode === "preview") setViewMode("split");
    else setViewMode("code");
  };

  const exportAsMarkdown = () => {
    if (!activeDocument) return;
    const blob = new Blob([activeDocument.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeDocument.title}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsPDF = () => {
    window.print();
  };

  const exportAsWord = async () => {
    if (!activeDocument) return;
    const previewElement = document.querySelector(".markdown-preview");
    if (!previewElement) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="UTF-8">
        <title>${activeDocument.title}</title>
        <style>
          body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.6; }
          h1 { font-size: 24pt; font-weight: bold; }
          h2 { font-size: 18pt; font-weight: bold; }
          code { background-color: #f4f4f4; padding: 2px 6px; font-family: 'Courier New', monospace; }
        </style>
      </head>
      <body>${previewElement.innerHTML}</body>
      </html>
    `;

    const blob = new Blob(["\ufeff", htmlContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeDocument.title}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportWorkspace = async () => {
    try {
      const data = await exportWorkspace();
      const zip = new JSZip();

      // Create folders in zip
      const folderMap = new Map<string, string>();
      data.folders.forEach((folder) => {
        const path = folder.name;
        folderMap.set(folder.id, path);
        zip.folder(path);
      });

      // Add documents
      data.documents.forEach((doc) => {
        const folderPath = doc.folderId ? folderMap.get(doc.folderId) || "" : "";
        const filePath = folderPath ? `${folderPath}/${doc.title}.md` : `${doc.title}.md`;
        zip.file(filePath, doc.content);
      });

      // Add metadata file
      zip.file("workspace-metadata.json", JSON.stringify(data, null, 2));

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `workspace-backup-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Workspace exported",
        description: "Your workspace has been exported successfully.",
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description: "Failed to export workspace. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImportWorkspace = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".zip";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const zip = await JSZip.loadAsync(file);
        const metadataFile = zip.file("workspace-metadata.json");
        if (metadataFile) {
          const content = await metadataFile.async("string");
          const data = JSON.parse(content);
          await importWorkspace(data);
          setRefreshSidebar((prev) => prev + 1);
          toast({
            title: "Workspace imported",
            description: "Your workspace has been imported successfully.",
          });
        }
      } catch (error) {
        console.error("Import failed:", error);
        toast({
          title: "Import failed",
          description: "Failed to import workspace. Please check the file.",
          variant: "destructive",
        });
      }
    };
    input.click();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex flex-col w-full">
        {/* Header */}
        <header className="border-b border-border bg-card peer-data-[state=expanded]:md:pl-[--sidebar-width] peer-data-[state=collapsed]:md:pl-0 transition-[padding] duration-200 ease-linear sticky top-0 z-20">
          <div className="px-4 py-3 flex items-center gap-4">
            <SidebarTrigger className="h-8 w-8 p-0 border-0 hover:bg-accent" />
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Smart MD Viewer</h1>
            </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link to="/tickets">
              <Button variant="outline" size="sm">
                <Kanban className="w-4 h-4 mr-2" />
                Tickets
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setSandboxOpen(true)}>
              <Network className="w-4 h-4 mr-2" />
              Diagram Editor
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Archive className="w-4 h-4 mr-2" />
                  Workspace
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover border-border z-50">
                <DropdownMenuItem onClick={handleExportWorkspace}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Workspace
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportWorkspace}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

        {/* Main Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <DocumentSidebar
          key={refreshSidebar}
          onDocumentSelect={handleDocumentSelect}
          onNewDocument={handleNewDocument}
          onDeleteDocument={handleDeleteDocument}
          onRenameDocument={handleRenameDocument}
          onTogglePin={handleTogglePin}
          onAddTag={handleAddTag}
          onMoveDocument={handleMoveDocument}
          onCreateFolder={handleCreateFolder}
          onDeleteFolder={handleDeleteFolder}
          onRenameFolder={handleRenameFolder}
          activeDocumentId={activeDocument?.id || null}
          currentFolderId={activeDocument?.folderId || null}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {!activeDocument ? (
            <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
              <div className="p-6 rounded-full bg-muted/50 mb-6">
                <FileText className="w-16 h-16 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Document Workspace</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Create a new document to get started, or select an existing one from the sidebar.
              </p>
              <Button onClick={() => handleNewDocument(null)}>
                <FileText className="w-4 h-4 mr-2" />
                Create New Document
              </Button>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Document Header */}
              <div className="border-b border-border bg-card p-4">
                <div className="flex items-center gap-4 mb-3">
                  <Input
                    ref={titleInputRef}
                    value={activeDocument.title}
                    onChange={(e) => updateDocumentTitle(e.target.value)}
                    className="text-xl font-semibold border-none shadow-none focus-visible:ring-0 px-0"
                  />
                </div>
                
                {/* Tags */}
                <div className="flex items-center gap-2 mb-3">
                  {activeDocument.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      #{tag} ×
                    </Badge>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => handleAddTag(activeDocument.id)}>
                    + Tag
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={toggleViewMode}>
                    {viewMode === "code" ? (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </>
                    ) : viewMode === "preview" ? (
                      <>
                        <Code className="w-4 h-4 mr-2" />
                        Split
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Code
                      </>
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-popover border-border z-50">
                      <DropdownMenuItem onClick={exportAsMarkdown}>Download as .md</DropdownMenuItem>
                      <DropdownMenuItem onClick={exportAsPDF}>Export as PDF</DropdownMenuItem>
                      <DropdownMenuItem onClick={exportAsWord}>Export as Word (.doc)</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-auto p-6">
                {viewMode === "split" ? (
                  <div className="flex gap-4 h-full">
                    <div className="flex-1 min-w-0">
                      <Textarea
                        value={activeDocument.content}
                        onChange={(e) => updateDocumentContent(e.target.value)}
                        className="min-h-full h-full font-mono text-sm bg-code-bg text-code-text resize-none"
                        placeholder="Type your Markdown here..."
                      />
                    </div>
                    <div className="flex-1 min-w-0 border-l border-border pl-4">
                      <div className="markdown-preview">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code(props) {
                              const { children, className, ...rest } = props;
                              const match = /language-(\w+)/.exec(className || "");

                              if (match && match[1] === "mermaid") {
                                return <MermaidDiagram chart={String(children).replace(/\n$/, "")} />;
                              }

                              return match ? (
                                <SyntaxHighlighter
                                  // @ts-expect-error - SyntaxHighlighter type definition issue
                                  style={oneDark}
                                  language={match[1]}
                                  PreTag="div"
                                >
                                  {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...rest}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {activeDocument.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ) : viewMode === "preview" ? (
                  <div className="markdown-preview">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code(props) {
                          const { children, className, ...rest } = props;
                          const match = /language-(\w+)/.exec(className || "");

                          if (match && match[1] === "mermaid") {
                            return <MermaidDiagram chart={String(children).replace(/\n$/, "")} />;
                          }

                          return match ? (
                            <SyntaxHighlighter
                              // @ts-expect-error - SyntaxHighlighter type definition issue
                              style={oneDark}
                              language={match[1]}
                              PreTag="div"
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...rest}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {activeDocument.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <Textarea
                    value={activeDocument.content}
                    onChange={(e) => updateDocumentContent(e.target.value)}
                    className="min-h-full font-mono text-sm bg-code-bg text-code-text resize-none"
                    placeholder="Type your Markdown here..."
                  />
                )}
              </div>
            </div>
          )}
        </main>
      </div>

        {/* Tag Dialog */}
        <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add Tag</DialogTitle>
            </DialogHeader>
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveTag();
                }
              }}
              placeholder="Enter tag name..."
              className="bg-background border-input text-foreground"
              autoFocus
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTag}>Add Tag</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Mermaid Sandbox Modal */}
        <MermaidSandbox open={sandboxOpen} onOpenChange={setSandboxOpen} />
      </div>
    </SidebarProvider>
  );
};

export default Index;
