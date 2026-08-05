import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { FileText, Eye, Code, Download, Network, Archive, Upload, Share2, AlignLeft, Maximize2, Minimize2, Copy, HelpCircle, MoreVertical, FolderOpen } from "lucide-react";
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
import { ReaderControls, getSavedReaderSettings, ReaderSettings } from "@/components/ReaderControls";
import { ShareDialog } from "@/components/ShareDialog";
import {
  GoogleUser,
  getStoredGoogleUser,
  createNativeGoogleDoc,
  uploadMarkdownFileToDrive,
} from "@/services/googleDrive";
import { GoogleDriveConnectModal } from "@/components/GoogleDriveConnectModal";
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
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);
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

  // Google Drive & Docs Integration State
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(getStoredGoogleUser);
  const [googleDriveModalOpen, setGoogleDriveModalOpen] = useState(false);
  const [isExportingGoogleDoc, setIsExportingGoogleDoc] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);

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
      } else if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        setKeyboardShortcutsOpen((prev) => !prev);
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

  // ── Copy as Rich Text ─────────────────────────────────────────────────────
  // Writes text/html to clipboard so pasting into Google Docs, Notion,
  // Confluence, Word etc. preserves ALL formatting (headings, bold, tables…)
  const copyAsRichText = async () => {
    if (!activeDocument) return;
    const previewElement = document.querySelector(".markdown-preview");
    if (!previewElement) return;

    // Inline minimal styles so they survive across apps that don't honour class names
    const styledHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.6;color:#111;}
h1{font-size:22pt;font-weight:700;margin:16pt 0 6pt;}
h2{font-size:16pt;font-weight:700;margin:14pt 0 5pt;}
h3{font-size:13pt;font-weight:700;margin:12pt 0 4pt;}
h4{font-size:11pt;font-weight:700;margin:10pt 0 3pt;}
p{margin:0 0 8pt;}
ul,ol{margin:4pt 0 8pt 18pt;}
li{margin-bottom:3pt;}
blockquote{border-left:3px solid #ccc;margin:8pt 0 8pt 4pt;padding:4pt 12pt;color:#555;}
code{font-family:'Courier New',monospace;background:#f5f5f5;padding:1px 5px;border-radius:3px;font-size:10pt;}
pre{font-family:'Courier New',monospace;background:#f5f5f5;padding:10pt;border-radius:4pt;overflow-x:auto;white-space:pre-wrap;font-size:9.5pt;}
table{border-collapse:collapse;width:100%;margin:8pt 0;}
th,td{border:1px solid #ddd;padding:6pt 10pt;text-align:left;}
th{background:#f0f0f0;font-weight:700;}
tr:nth-child(even) td{background:#fafafa;}
a{color:#1a73e8;text-decoration:underline;}
strong{font-weight:700;}
em{font-style:italic;}
</style></head>
<body>${previewElement.innerHTML}</body>
</html>`;

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([styledHtml], { type: "text/html" }),
          "text/plain": new Blob([activeDocument.content], { type: "text/plain" }),
        }),
      ]);
      toast({
        title: "Rich text copied!",
        description: "Paste into Google Docs, Notion, or Word — formatting is preserved.",
      });
    } catch {
      // Fallback to plain markdown if ClipboardItem is blocked
      await navigator.clipboard.writeText(activeDocument.content);
      toast({
        title: "Copied (plain text)",
        description: "Your browser blocked rich-text copy. Raw markdown was copied instead.",
        variant: "destructive",
      });
    }
  };

  // ── Google Drive API & Native Google Doc Integration ──────────────────────
  const handleCreateGoogleDoc = async () => {
    if (!activeDocument) return;
    if (!googleUser) {
      setGoogleDriveModalOpen(true);
      toast({
        title: "Google Connect Required",
        description: "Please connect your Google account to create native Google Docs.",
      });
      return;
    }

    const previewElement = document.querySelector(".markdown-preview");
    if (!previewElement) {
      toast({
        title: "Preview Not Loaded",
        description: "Please render the preview before exporting.",
        variant: "destructive",
      });
      return;
    }

    setIsExportingGoogleDoc(true);
    toast({
      title: "Creating Google Doc...",
      description: "Converting Markdown into a native Google Doc via Google Drive API...",
    });

    try {
      const result = await createNativeGoogleDoc(
        googleUser.accessToken,
        activeDocument.title,
        previewElement.innerHTML
      );
      window.open(result.webViewLink, "_blank");
      toast({
        title: "Google Doc Created! 🎉",
        description: `Successfully generated "${activeDocument.title}". Opened in a new tab.`,
      });
    } catch (err: any) {
      if (err?.message?.includes("invalid_grant") || err?.message?.includes("401")) {
        setGoogleUser(null);
        setGoogleDriveModalOpen(true);
        toast({
          title: "Session Expired",
          description: "Please re-connect your Google Account.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Export Failed",
          description: err?.message || "Failed to create Google Doc",
          variant: "destructive",
        });
      }
    } finally {
      setIsExportingGoogleDoc(false);
    }
  };

  const handleSaveToDrive = async () => {
    if (!activeDocument) return;
    if (!googleUser) {
      setGoogleDriveModalOpen(true);
      toast({
        title: "Google Connect Required",
        description: "Please connect your Google account to save files to Google Drive.",
      });
      return;
    }

    setIsUploadingToDrive(true);
    toast({
      title: "Uploading to Drive...",
      description: `Saving "${activeDocument.title}.md" to Google Drive...`,
    });

    try {
      const result = await uploadMarkdownFileToDrive(
        googleUser.accessToken,
        activeDocument.title,
        activeDocument.content
      );
      window.open(result.webViewLink, "_blank");
      toast({
        title: "Saved to Google Drive! ☁️",
        description: `File saved successfully. Click to view on Drive.`,
      });
    } catch (err: any) {
      if (err?.message?.includes("invalid_grant") || err?.message?.includes("401")) {
        setGoogleUser(null);
        setGoogleDriveModalOpen(true);
        toast({
          title: "Session Expired",
          description: "Please re-connect your Google Account.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Upload Failed",
          description: err?.message || "Failed to upload file to Google Drive",
          variant: "destructive",
        });
      }
    } finally {
      setIsUploadingToDrive(false);
    }
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
        {/* ─── LANDING NAV (no document open) ─── */}
        {!isFocusMode && !activeDocument && (
          <header className="sticky top-0 z-20 border-b border-border/50 bg-background/80 backdrop-blur-md">
            <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-sm tracking-tight">Smart MD</span>
                <span className="hidden sm:inline text-xs text-muted-foreground/60 font-medium px-1.5 py-0.5 bg-muted rounded">
                  Local-first · Private
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button variant="ghost" size="sm" onClick={() => setSandboxOpen(true)} className="hidden sm:flex gap-1.5">
                  <Network className="w-3.5 h-3.5" />
                  Diagrams
                </Button>
                <Button size="sm" onClick={handleOpenMarkdownFile} className="gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5" />
                  Open File
                </Button>
              </div>
            </div>
          </header>
        )}

        {/* ─── APP HEADER (document open) ─── */}
        {!isFocusMode && activeDocument && (
        <header className="border-b border-border bg-card peer-data-[state=expanded]:md:pl-[--sidebar-width] peer-data-[state=collapsed]:md:pl-0 transition-[padding] duration-200 ease-linear sticky top-0 z-20">
          <div className="px-4 py-3 flex items-center gap-4">
            {activeDocument && (
              <SidebarTrigger className="h-8 w-8 p-0 border-0 hover:bg-accent" />
            )}
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
                <Button variant="ghost" size="sm" onClick={() => setKeyboardShortcutsOpen(true)} title="Keyboard Shortcuts (?)">
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </Button>
                <div className="h-4 w-px bg-border mx-1" />
                
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(activeDocument.content);
                    toast({ title: "Copied!", description: "Raw markdown copied to clipboard." });
                  }}
                  title="Copy Raw Markdown"
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy Raw
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
                    <DropdownMenuContent align="end" className="w-60 bg-popover border-border z-50">
                      {/* ── Docs integrations ── */}
                      <div className="px-2 py-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Send to Docs</p>
                        <button
                          onClick={copyAsRichText}
                          className="w-full flex items-center gap-2.5 px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                        >
                          <span className="text-base">📋</span>
                          <div>
                            <p className="font-medium leading-none mb-0.5">Copy as Rich Text</p>
                            <p className="text-[10px] text-muted-foreground">Paste into Google Docs with formatting</p>
                          </div>
                        </button>
                        
                        <button
                          onClick={handleCreateGoogleDoc}
                          disabled={isExportingGoogleDoc}
                          className="w-full flex items-center gap-2.5 px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors text-left disabled:opacity-50"
                        >
                          <span className="text-base">📄</span>
                          <div>
                            <p className="font-medium leading-none mb-0.5">Create Google Doc</p>
                            <p className="text-[10px] text-muted-foreground">
                              {googleUser ? `Native doc for ${googleUser.email.split("@")[0]}` : "1-click native Google Doc"}
                            </p>
                          </div>
                        </button>

                        <button
                          onClick={handleSaveToDrive}
                          disabled={isUploadingToDrive}
                          className="w-full flex items-center gap-2.5 px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors text-left disabled:opacity-50"
                        >
                          <span className="text-base">☁️</span>
                          <div>
                            <p className="font-medium leading-none mb-0.5">Save to Google Drive</p>
                            <p className="text-[10px] text-muted-foreground">Upload .md file to Drive</p>
                          </div>
                        </button>
                      </div>
                      <div className="h-px bg-border mx-2 my-1" />
                      {/* ── File exports ── */}
                      <div className="px-2 py-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Download</p>
                        <DropdownMenuItem onClick={exportAsMarkdown}>Raw Markdown (.md)</DropdownMenuItem>
                        <DropdownMenuItem onClick={exportAsPDF}>Print / Save as PDF</DropdownMenuItem>
                        <DropdownMenuItem onClick={exportAsWord}>Word Document (.doc)</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportWorkspace}>Workspace Archive (.zip)</DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            
            {/* Mobile Actions Overlay */}
            {activeDocument && !isFocusMode && (
              <div className="flex md:hidden items-center gap-1 ml-auto">
                <ReaderControls settings={readerSettings} onChange={setReaderSettings} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-popover border-border z-50">
                    <DropdownMenuItem onClick={() => setShowToc((prev) => !prev)}>
                      <AlignLeft className="w-4 h-4 mr-2" /> TOC
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={toggleViewMode}>
                      {viewMode === "code" ? <><Eye className="w-4 h-4 mr-2" /> Preview</> : viewMode === "preview" ? <><Code className="w-4 h-4 mr-2" /> Split</> : <><FileText className="w-4 h-4 mr-2" /> Code</>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
                      <Share2 className="w-4 h-4 mr-2" /> Share
                    </DropdownMenuItem>
                    <div className="h-px bg-border mx-2 my-1" />
                    <DropdownMenuItem onClick={copyAsRichText}>
                      <Copy className="w-4 h-4 mr-2" /> Copy as Rich Text
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCreateGoogleDoc}>
                      <span className="mr-2">📄</span> Create Google Doc
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSaveToDrive}>
                      <span className="mr-2">☁️</span> Save to Google Drive
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportAsMarkdown}>
                      <Download className="w-4 h-4 mr-2" /> Export .md
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <div className="hidden sm:flex ml-auto items-center gap-2">
              <Button
                variant={googleUser ? "secondary" : "outline"}
                size="sm"
                onClick={() => setGoogleDriveModalOpen(true)}
                title={googleUser ? `Google Connected: ${googleUser.email}` : "Connect Google Drive"}
                className="gap-1.5"
              >
                {googleUser?.picture ? (
                  <img src={googleUser.picture} alt="" className="w-4 h-4 rounded-full" />
                ) : (
                  <span className="text-sm">☁️</span>
                )}
                <span className="hidden md:inline">
                  {googleUser ? googleUser.name.split(" ")[0] : "Google Drive"}
                </span>
                {googleUser && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              </Button>
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
          {/* Sidebar — only shown when a document is open */}
          {!isFocusMode && activeDocument && (
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

        {/* Main Content — fade-in when switching docs */}
        <main className="flex-1 overflow-auto transition-opacity duration-200">
          {!activeDocument ? (
            <LandingHero
              onOpenFile={handleOpenMarkdownFile}
              onPasteRender={handlePasteRender}
              onCreateNew={() => handleNewDocument(null)}
              fileInputRef={localFileInputRef}
            />
          ) : (
            <div className="h-full flex flex-col bg-muted/20 animate-in fade-in duration-200">
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
                  {activeDocument && (
                    <div className="flex items-center text-xs text-muted-foreground mr-2 font-medium bg-muted/50 px-2 py-1 rounded-md border border-border/50 shadow-sm">
                      <span className="flex items-center gap-1">
                        {Math.max(1, Math.ceil((activeDocument.content.match(/\S+/g) || []).length / 238))} min
                      </span>
                      <span className="mx-1.5 opacity-40 hidden sm:inline">·</span>
                      <span className="hidden sm:inline">
                        {(activeDocument.content.match(/\S+/g) || []).length.toLocaleString()} words
                      </span>
                    </div>
                  )}
                  
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
                      <div className={`flex-1 min-w-0 overflow-auto bg-card border border-border/60 rounded-xl shadow-md p-6 reader-font-${readerSettings.fontSize} reader-family-${readerSettings.fontFamily || "sans"}`}>
                        <Suspense fallback={<div className="p-4 text-muted-foreground text-center animate-pulse">Loading preview...</div>}>
                          <MarkdownPreview content={activeDocument.content} showFrontmatter={readerSettings.showFrontmatter} />
                        </Suspense>
                      </div>
                    </div>
                  ) : viewMode === "preview" ? (
                    <div className="py-8 px-4 sm:px-8 max-w-5xl mx-auto w-full">
                      <div className={`bg-card border border-border/60 rounded-xl shadow-lg p-6 sm:p-12 reader-font-${readerSettings.fontSize} reader-width-${readerSettings.lineWidth} reader-family-${readerSettings.fontFamily || "sans"}${readerSettings.themeTone === "sepia" ? " reader-tone-sepia" : ""}`}>
                        <Suspense fallback={<div className="p-4 text-muted-foreground text-center animate-pulse">Loading preview...</div>}>
                          <MarkdownPreview content={activeDocument.content} showFrontmatter={readerSettings.showFrontmatter} />
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

        {/* Keyboard Shortcuts Dialog */}
        <Dialog open={keyboardShortcutsOpen} onOpenChange={setKeyboardShortcutsOpen}>
          <DialogContent className="bg-card border-border sm:max-w-[460px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" />
                Keyboard Shortcuts
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-1 py-2">
              {([
                { section: "Navigation" },
                { key: "T", desc: "Toggle Table of Contents" },
                { key: "F", desc: "Toggle Focus Mode" },
                { key: "Esc", desc: "Exit Focus Mode" },
                { key: "Shift + ?", desc: "Show this help dialog" },
                { section: "Document" },
                { key: "Ctrl + S", desc: "Save / Export as .md" },
                { section: "Tools" },
                { key: "Display button", desc: "Change font, size, width, tone" },
                { key: "TOC button", desc: "Toggle Table of Contents panel" },
                { key: "Diagram Editor", desc: "Open Mermaid diagram sandbox" },
                { section: "Diagrams" },
                { key: "Hover diagram", desc: "Reveal zoom + fullscreen controls" },
                { key: "Esc", desc: "Close fullscreen diagram" },
              ] as Array<{section?: string; key?: string; desc?: string}>).map((item, i) =>
                item.section ? (
                  <p key={i} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-3 mb-1 first:mt-0">
                    {item.section}
                  </p>
                ) : (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                    <span className="text-sm text-muted-foreground">{item.desc}</span>
                    <kbd className="ml-4 shrink-0 px-2 py-0.5 bg-muted border border-border rounded text-xs font-mono font-medium text-foreground">
                      {item.key}
                    </kbd>
                  </div>
                )
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setKeyboardShortcutsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {/* Google Drive Connection & Settings Modal */}
      <GoogleDriveConnectModal
        open={googleDriveModalOpen}
        onOpenChange={setGoogleDriveModalOpen}
        currentUser={googleUser}
        onUserChange={setGoogleUser}
      />
    </SidebarProvider>
  );
};

export default Index;
