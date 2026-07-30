import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { FileText, Eye, Code, Download, Network, Archive, Upload, Kanban, Share2, AlignLeft, Maximize2, Minimize2 } from "lucide-react";
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

const MermaidSandbox = lazy(() => import("@/components/MermaidSandbox").then((module) => ({ default: module.MermaidSandbox })));
const MarkdownPreview = lazy(() => import("@/components/MarkdownPreview").then((module) => ({ default: module.MarkdownPreview })));
import { LandingHero } from "@/components/LandingHero";
import { DocumentSidebar, notifyWorkspaceUpdated } from "@/components/DocumentSidebar";
import { TableOfContents } from "@/components/TableOfContents";
import { ReaderControls, getSavedReaderSettings, ReaderSettings } from "@/components/ReaderControls";
import { ShareDialog } from "@/components/ShareDialog";
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
  deleteFolderAndMoveContentsToRoot,
  exportWorkspace,
  importWorkspace,
} from "@/lib/indexedDB";
import JSZip from "jszip";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  SharedDocumentPayload,
  EncryptedShareEnvelope,
  buildSecureShareLink,
  createEncryptedShareEnvelope,
  createEncryptedShareFileBlob,
  decodeEnvelopeFromShareLink,
  decryptEncryptedShareEnvelope,
  parsePayloadFromLocationHash,
  readEncryptedShareEnvelopeFromFile,
  encodeEnvelopeForShareLink,
} from "@/lib/secureShare";

const MAX_SHARE_LINK_LENGTH = 7000; // Conservative URL limit to avoid browser/client truncation.
const SHARE_PREVIEW_MAX_CHARS = 260;

const Index = () => {
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "code" | "split">("preview");
  const [isUnsavedFile, setIsUnsavedFile] = useState(false);
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [showToc, setShowToc] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(getSavedReaderSettings);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const localFileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharePassphrase, setSharePassphrase] = useState("");
  const [importPassphrase, setImportPassphrase] = useState("");
  const [pendingImportEnvelope, setPendingImportEnvelope] = useState<EncryptedShareEnvelope | null>(null);
  const [importPreview, setImportPreview] = useState<SharedDocumentPayload | null>(null);
  const hasProcessedSharedHashRef = useRef(false);
  const { toast } = useToast();

  // Initialize IndexedDB
  useEffect(() => {
    initDB();

    if (!hasProcessedSharedHashRef.current) {
      hasProcessedSharedHashRef.current = true;
      const sharedPayload = parsePayloadFromLocationHash(window.location.hash);
      if (sharedPayload) {
        try {
          const envelope = decodeEnvelopeFromShareLink(sharedPayload);
          setPendingImportEnvelope(envelope);
          setShareDialogOpen(true);
          toast({
            title: "Shared link detected",
            description: "Enter the import passphrase to preview and save this document.",
          });
        } catch {
          toast({
            title: "Invalid shared link",
            description: "The shared payload is malformed or unsupported.",
            variant: "destructive",
          });
        }
      }
    }
  }, [toast]);

  useEffect(() => () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  }, []);

  // Hotkeys: 't' for TOC, 'f' for Focus Mode, 'Escape' to exit Focus Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (e.key === "Escape" && isFocusMode) {
        setIsFocusMode(false);
        return;
      }

      if (isTyping) return;

      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        setShowToc((prev) => !prev);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setIsFocusMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocusMode]);

  const handleSaveLocalFile = async () => {
    if (!activeDocument) return;
    try {
      const savedDocument = { ...activeDocument, id: `doc-${crypto.randomUUID()}`, updatedAt: Date.now() };
      await saveDocument(savedDocument);
      setActiveDocument(savedDocument);
      setIsUnsavedFile(false);
      notifyWorkspaceUpdated();
      toast({ title: "Saved to workspace", description: "Your local Markdown file is now a workspace document." });
    } catch {
      toast({ title: "Save failed", description: "The document could not be saved to your workspace.", variant: "destructive" });
    }
  };

  const handlePasteRender = useCallback((content: string, title = "Pasted Markdown") => {
    const now = Date.now();
    setActiveDocument({
      id: `local-${crypto.randomUUID()}`,
      title,
      content,
      folderId: null,
      tags: [],
      isPinned: false,
      createdAt: now,
      updatedAt: now,
    });
    setIsUnsavedFile(true);
    setViewMode("preview");
  }, []);

  const handleOpenMarkdownFile = () => {
    if (localFileInputRef.current) {
      localFileInputRef.current.click();
    }
  };

  useEffect(() => {
    const input = localFileInputRef.current;
    if (!input) return;
    const handleChange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const content = await file.text();
        const title = file.name.replace(/\.md(?:own)?$/i, "") || "Opened File";
        handlePasteRender(content, title);
      } catch { /* ignore */ }
      input.value = "";
    };
    input.addEventListener("change", handleChange);
    return () => input.removeEventListener("change", handleChange);
  }, [handlePasteRender]);

  useEffect(() => {
    const handleWindowDrop = async (e: DragEvent) => {
      if (activeDocument) return;
      e.preventDefault();
      const file = e.dataTransfer?.files[0];
      if (!file) return;
      const isMarkdown = file.name.endsWith(".md") || file.name.endsWith(".markdown") || file.type === "text/markdown" || file.type === "text/plain";
      if (!isMarkdown) return;
      try {
        const content = await file.text();
        const title = file.name.replace(/\.md(?:own)?$/i, "") || "Dropped File";
        handlePasteRender(content, title);
      } catch { /* ignore unreadable files */ }
    };

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener("drop", handleWindowDrop);
    window.addEventListener("dragover", handleWindowDragOver);
    return () => {
      window.removeEventListener("drop", handleWindowDrop);
      window.removeEventListener("dragover", handleWindowDragOver);
    };
  }, [activeDocument, handlePasteRender]);

  // Auto-save with debounce
  const autoSave = useCallback((doc: Document) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      await saveDocument(doc);
      notifyWorkspaceUpdated();
    }, 500);
  }, []);

  const handleDocumentSelect = async (doc: Document) => {
    // If there's a pending autosave for the current document, flush it immediately
    if (saveTimeoutRef.current && activeDocument && !isUnsavedFile) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = undefined;
      try {
        await saveDocument(activeDocument);
      } catch {
        // Silent — we're switching away, best effort save
      }
    } else if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = undefined;
    }
    setActiveDocument(doc);
    setIsUnsavedFile(false);
    setViewMode("preview");
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
    setIsUnsavedFile(false);
    setViewMode("preview");
    notifyWorkspaceUpdated();
    
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
    notifyWorkspaceUpdated();
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
      notifyWorkspaceUpdated();
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
      notifyWorkspaceUpdated();
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
        notifyWorkspaceUpdated();
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
    notifyWorkspaceUpdated();
  };

  const handleMoveDocument = async (docId: string, folderId: string | null) => {
    const doc = await getDocument(docId);
    if (doc) {
      const updated = { ...doc, folderId, updatedAt: Date.now() };
      await saveDocument(updated);
      if (activeDocument?.id === docId) {
        setActiveDocument(updated);
      }
      notifyWorkspaceUpdated();
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
    notifyWorkspaceUpdated();
  };

  const handleDeleteFolder = async (folderId: string) => {
    // Browser-native confirm as the simplest safe guard
    // (A proper dialog is in the T21 refactor scope)
    const confirmed = window.confirm(
      "Delete this folder? All documents and subfolders inside will be moved to the workspace root."
    );
    if (!confirmed) return;
    
    try {
      await deleteFolderAndMoveContentsToRoot(folderId);
      notifyWorkspaceUpdated();
      toast({
        title: "Folder deleted",
        description: "Its documents and direct subfolders were moved to the workspace root.",
      });
    } catch {
      toast({
        title: "Delete failed",
        description: "The folder could not be deleted. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    const folder = await getFolder(folderId);
    if (folder) {
      const updated = { ...folder, name: newName.trim() || "Unnamed Folder" };
      await saveFolder(updated);
      notifyWorkspaceUpdated();
    }
  };

  const updateDocumentTitle = (newTitle: string) => {
    if (!activeDocument) return;
    const updated = { ...activeDocument, title: newTitle, updatedAt: Date.now() };
    setActiveDocument(updated);
    if (!isUnsavedFile) autoSave(updated);
  };

  const updateDocumentContent = (newContent: string) => {
    if (!activeDocument) return;
    const updated = { ...activeDocument, content: newContent, updatedAt: Date.now() };
    setActiveDocument(updated);
    if (!isUnsavedFile) autoSave(updated);
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
          notifyWorkspaceUpdated();
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

  const clearSharedPayloadFromUrl = () => {
    if (window.location.hash.includes("payload=")) {
      window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}`);
    }
  };

  const ensurePassphrase = (passphrase: string) => {
    if (passphrase.trim().length < 8) {
      throw new Error("Passphrase must contain at least 8 characters (excluding leading/trailing whitespace).");
    }
  };

  const handleCopySecureLink = async () => {
    if (!activeDocument) {
      toast({
        title: "No active document",
        description: "Open a document before generating a share link.",
        variant: "destructive",
      });
      return;
    }

    try {
      ensurePassphrase(sharePassphrase);
      const envelope = await createEncryptedShareEnvelope(activeDocument, sharePassphrase);
      const payload = encodeEnvelopeForShareLink(envelope);
      const link = buildSecureShareLink(payload);

      if (link.length > MAX_SHARE_LINK_LENGTH) {
        toast({
          title: "Link too large",
          description: "Use encrypted file share for large documents.",
          variant: "destructive",
        });
        return;
      }

      await navigator.clipboard.writeText(link);
      toast({
        title: "Secure link copied",
        description: "Share the link and passphrase separately.",
      });
    } catch (error) {
      toast({
        title: "Failed to create secure link",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadEncryptedShareFile = async () => {
    if (!activeDocument) {
      toast({
        title: "No active document",
        description: "Open a document before exporting share file.",
        variant: "destructive",
      });
      return;
    }

    try {
      ensurePassphrase(sharePassphrase);
      const envelope = await createEncryptedShareEnvelope(activeDocument, sharePassphrase);
      const blob = createEncryptedShareFileBlob(envelope);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${activeDocument.title || "document"}.smdshare`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Encrypted share file downloaded",
        description: "Share the file and passphrase separately.",
      });
    } catch (error) {
      toast({
        title: "Failed to export encrypted file",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImportEncryptedShareFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".smdshare,.json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const envelope = await readEncryptedShareEnvelopeFromFile(file);
        setPendingImportEnvelope(envelope);
        setImportPreview(null);
        setShareDialogOpen(true);
        toast({
          title: "Encrypted share file loaded",
          description: "Enter passphrase to decrypt and preview.",
        });
      } catch (error) {
        toast({
          title: "Invalid share file",
          description: error instanceof Error ? error.message : "Please check the file.",
          variant: "destructive",
        });
      }
    };
    input.click();
  };

  const handlePreviewImportedShare = async () => {
    if (!pendingImportEnvelope) {
      toast({
        title: "Nothing to import",
        description: "Load a shared link or .smdshare file first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = await decryptEncryptedShareEnvelope(pendingImportEnvelope, importPassphrase);
      setImportPreview(payload);
      toast({
        title: "Preview ready",
        description: "Review the document and save it to your local workspace.",
      });
    } catch (error) {
      toast({
        title: "Failed to decrypt share",
        description: error instanceof Error ? error.message : "Please verify passphrase and payload.",
        variant: "destructive",
      });
    }
  };

  const handleSaveImportedDocument = async () => {
    if (!importPreview) {
      toast({
        title: "No preview to save",
        description: "Decrypt and preview a shared document first.",
        variant: "destructive",
      });
      return;
    }

    const now = Date.now();
    const importedDocument: Document = {
      id: `doc-${crypto.randomUUID()}`,
      title: importPreview.title.trim() || "Imported Document",
      content: importPreview.content,
      folderId: null,
      tags: importPreview.tags,
      isPinned: importPreview.isPinned,
      createdAt: now,
      updatedAt: now,
    };

    await saveDocument(importedDocument);
    setActiveDocument(importedDocument);
    setViewMode("split");
    notifyWorkspaceUpdated();
    clearSharedPayloadFromUrl();
    setPendingImportEnvelope(null);
    setImportPreview(null);
    setImportPassphrase("");
    setShareDialogOpen(false);

    toast({
      title: "Imported successfully",
      description: "The shared document is now saved in your local workspace.",
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex flex-col w-full">
        {/* App Header */}
        {!isFocusMode && (
        <header className="border-b border-border bg-card peer-data-[state=expanded]:md:pl-[--sidebar-width] peer-data-[state=collapsed]:md:pl-0 transition-[padding] duration-200 ease-linear sticky top-0 z-20">
          <div className="px-4 py-3 flex items-center gap-4">
            <SidebarTrigger className="h-8 w-8 p-0 border-0 hover:bg-accent" />
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h1 className="text-base font-bold tracking-tight">Smart MD</h1>
              {activeDocument && (
                <div className="flex items-center gap-2 pl-2 border-l border-border">
                  <span className="text-xs font-medium text-muted-foreground max-w-[180px] truncate">
                    {activeDocument.title}
                  </span>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
                    .md
                  </Badge>
                </div>
              )}
            </div>

            {/* Active Document Header Actions */}
            {activeDocument && !isFocusMode && (
              <div className="hidden md:flex items-center gap-1.5 ml-4">
                <ReaderControls settings={readerSettings} onChange={setReaderSettings} />
                <Button
                  variant={showToc ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowToc((prev) => !prev)}
                  title="Toggle Table of Contents (Hotkey: T)"
                >
                  <AlignLeft className="w-3.5 h-3.5 mr-1.5" />
                  TOC
                </Button>
                <Button variant="outline" size="sm" onClick={toggleViewMode}>
                  {viewMode === "code" ? (
                    <>
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      Preview
                    </>
                  ) : viewMode === "preview" ? (
                    <>
                      <Code className="w-3.5 h-3.5 mr-1.5" />
                      Split
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                      Code
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShareDialogOpen(true)}>
                  <Share2 className="w-3.5 h-3.5 mr-1.5" />
                  Share
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-popover border-border z-50">
                      <DropdownMenuItem onClick={exportAsMarkdown}>Download as .md</DropdownMenuItem>
                      <DropdownMenuItem onClick={exportAsPDF}>Export as PDF</DropdownMenuItem>
                      <DropdownMenuItem onClick={exportAsWord}>Export as Word (.doc)</DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportWorkspace}>Export Workspace (.zip)</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
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
        )}

        {/* Main Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          {!isFocusMode && (
            <DocumentSidebar
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
          )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {!activeDocument ? (
            <LandingHero
              onOpenFile={handleOpenMarkdownFile}
              onPasteRender={handlePasteRender}
              onCreateNew={() => handleNewDocument(null)}
              fileInputRef={localFileInputRef}
            />
          ) : (
            <div className="h-full flex flex-col bg-muted/20">
              {/* Document Sub-Header Strip */}
              <div className="px-6 py-2 border-b border-border/40 bg-card/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Input
                    ref={titleInputRef}
                    value={activeDocument.title}
                    onChange={(e) => updateDocumentTitle(e.target.value)}
                    className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 h-8 max-w-md truncate"
                  />
                  <div className="hidden sm:flex items-center gap-1.5">
                    {activeDocument.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer text-[11px] px-2 py-0.5"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        #{tag} ×
                      </Badge>
                    ))}
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground px-2" onClick={() => handleAddTag(activeDocument.id)}>
                      + Tag
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant={isFocusMode ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setIsFocusMode((prev) => !prev)}
                    title="Toggle Focus Mode (Hotkey: F)"
                  >
                    <Maximize2 className="w-3.5 h-3.5 mr-1" />
                    Focus
                  </Button>
                </div>
              </div>

              {/* Content Area & TOC */}
              <div className="flex-1 flex min-h-0 overflow-hidden">
                <div className="flex-1 overflow-auto">
                  {viewMode === "split" ? (
                    <div className="flex gap-4 h-full p-6">
                      <div className="flex-1 min-w-0">
                        <Textarea
                          value={activeDocument.content}
                          onChange={(e) => updateDocumentContent(e.target.value)}
                          className="min-h-full h-full font-mono text-sm bg-code-bg text-code-text resize-none"
                          placeholder="Type your Markdown here..."
                        />
                      </div>
                      <div className="flex-1 min-w-0 overflow-auto bg-card border border-border/60 rounded-xl shadow-md p-6">
                        <Suspense fallback={<div className="p-4 text-muted-foreground text-center animate-pulse">Loading preview...</div>}>
                          <MarkdownPreview content={activeDocument.content} />
                        </Suspense>
                      </div>
                    </div>
                  ) : viewMode === "preview" ? (
                    <div className="py-8 px-4 sm:px-8 max-w-5xl mx-auto w-full">
                      <div className={`bg-card border border-border/60 rounded-xl shadow-lg p-6 sm:p-12 reader-font-${readerSettings.fontSize} reader-width-${readerSettings.lineWidth} reader-family-${readerSettings.fontFamily || "sans"}`}>
                        <Suspense fallback={<div className="p-4 text-muted-foreground text-center animate-pulse">Loading preview...</div>}>
                          <MarkdownPreview content={activeDocument.content} />
                        </Suspense>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full p-6">
                      <Textarea
                        value={activeDocument.content}
                        onChange={(e) => updateDocumentContent(e.target.value)}
                        className="min-h-full h-full font-mono text-sm bg-code-bg text-code-text resize-none"
                        placeholder="Type your Markdown here..."
                      />
                    </div>
                  )}
                </div>

                {showToc && (
                  <TableOfContents
                    markdown={activeDocument.content}
                    onClose={() => setShowToc(false)}
                  />
                )}
              </div>
            </div>
          )}

          {/* Floating Exit Focus Button */}
          {isFocusMode && (
            <Button
              variant="secondary"
              size="sm"
              className="fixed top-4 right-4 z-50 shadow-md opacity-80 hover:opacity-100 transition-opacity"
              onClick={() => setIsFocusMode(false)}
            >
              <Minimize2 className="w-4 h-4 mr-2" />
              Exit Focus (Esc)
            </Button>
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

        {/* Secure Share Dialog */}
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          activeDocument={activeDocument}
          sharePassphrase={sharePassphrase}
          setSharePassphrase={setSharePassphrase}
          importPassphrase={importPassphrase}
          setImportPassphrase={setImportPassphrase}
          pendingImportEnvelope={pendingImportEnvelope}
          importPreview={importPreview}
          handleCopySecureLink={handleCopySecureLink}
          handleDownloadEncryptedShareFile={handleDownloadEncryptedShareFile}
          handleImportEncryptedShareFile={handleImportEncryptedShareFile}
          handlePreviewImportedShare={handlePreviewImportedShare}
          handleSaveImportedDocument={handleSaveImportedDocument}
          clearImportState={() => {
            setPendingImportEnvelope(null);
            setImportPreview(null);
            clearSharedPayloadFromUrl();
          }}
          previewMaxChars={SHARE_PREVIEW_MAX_CHARS}
        />
        
        {/* Mermaid Sandbox Modal */}
        <MermaidSandbox open={sandboxOpen} onOpenChange={setSandboxOpen} />
      </div>
    </SidebarProvider>
  );
};

export default Index;
