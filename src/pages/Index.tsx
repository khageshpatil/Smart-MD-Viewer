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
import { TableOfContents } from "@/components/TableOfContents";
import { DocumentSidebar, notifyWorkspaceUpdated } from "@/components/DocumentSidebar";
import { ReaderControls, getSavedReaderSettings, ReaderSettings } from "@/components/ReaderControls";
import { ShareDialog } from "@/components/ShareDialog";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import {
  GoogleUser,
  getStoredGoogleUser,
  createNativeGoogleDoc,
  uploadMarkdownFileToDrive,
  exportWorkspaceToGoogleDrive,
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

/**
 * Extracts a human-readable title from Markdown content.
 * Priority: frontmatter `title:` → first `# H1` → first non-empty text line → "Untitled"
 */
function extractMarkdownTitle(content: string): string {
  const lines = content.split("\n");

  // 1. Check YAML frontmatter for a title field
  if (lines[0]?.trim() === "---") {
    for (let i = 1; i < Math.min(lines.length, 20); i++) {
      const line = lines[i].trim();
      if (line === "---" || line === "...") break;
      const match = line.match(/^title:\s*["']?(.+?)["']?\s*$/);
      if (match) return match[1].trim();
    }
  }

  // 2. First H1 heading
  for (const line of lines) {
    const match = line.match(/^#\s+(.+)/);
    if (match) return match[1].replace(/\*|_|`/g, "").trim();
  }

  // 3. First non-empty, non-heading line of actual prose
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("---") && !trimmed.startsWith("```")) {
      return trimmed.replace(/\*|_|`|\[|\]/g, "").slice(0, 60);
    }
  }

  return "Untitled";
}

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

  // Initialize IndexedDB and restore last active document on refresh
  useEffect(() => {
    const init = async () => {
      await initDB();

      if (!hasProcessedSharedHashRef.current) {
        hasProcessedSharedHashRef.current = true;
        const sharedPayload = parsePayloadFromLocationHash(window.location.hash);

        if (sharedPayload) {
          // Shared link takes priority over last-active restoration
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
        } else {
          // Restore last active workspace document after refresh
          const lastDocId = localStorage.getItem("smartmd-last-doc-id");
          if (lastDocId) {
            try {
              const doc = await getDocument(lastDocId);
              if (doc) {
                setActiveDocument(doc);
                const savedMode = localStorage.getItem("smartmd-view-mode") as "preview" | "code" | "split" | null;
                if (savedMode) setViewMode(savedMode);
              } else {
                // Document was deleted — clear the stale ID
                localStorage.removeItem("smartmd-last-doc-id");
              }
            } catch {
              localStorage.removeItem("smartmd-last-doc-id");
            }
          }
        }
      }
    };

    init();
  }, [toast]);

  // Persist active document ID and view mode so refresh restores the session
  useEffect(() => {
    if (activeDocument && !isUnsavedFile) {
      localStorage.setItem("smartmd-last-doc-id", activeDocument.id);
    } else if (!activeDocument) {
      localStorage.removeItem("smartmd-last-doc-id");
    }
  }, [activeDocument, isUnsavedFile]);

  useEffect(() => {
    localStorage.setItem("smartmd-view-mode", viewMode);
  }, [viewMode]);

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

  const handlePasteRender = useCallback((content: string, title?: string) => {
    const resolvedTitle = title?.trim() || extractMarkdownTitle(content);
    const now = Date.now();
    setActiveDocument({
      id: `local-${crypto.randomUUID()}`,
      title: resolvedTitle,
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
    localFileInputRef.current?.click();
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await file.text();
      const title = file.name.replace(/\.md(?:own)?$/i, "") || "Opened File";
      handlePasteRender(content, title);
      toast({
        title: "File opened",
        description: `Loaded "${file.name}"`,
      });
    } catch {
      toast({
        title: "Failed to open file",
        description: "Could not read the selected file.",
        variant: "destructive",
      });
    }
    e.target.value = "";
  };

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

  const handleExportWorkspaceToDrive = async () => {
    if (!googleUser) {
      setGoogleDriveModalOpen(true);
      toast({
        title: "Google Connect Required",
        description: "Please connect your Google account to export your workspace to Google Drive.",
      });
      return;
    }

    toast({
      title: "Exporting Workspace to Google Drive...",
      description: "Creating folders and uploading files...",
    });

    try {
      const result = await exportWorkspaceToGoogleDrive(googleUser.accessToken, (progress) => {
        toast({
          title: `Uploading (${progress.current}/${progress.total})`,
          description: `Uploading "${progress.currentItem}"...`,
        });
      });
      window.open(result.folderUrl, "_blank");
      toast({
        title: "Workspace Exported to Drive! ☁️",
        description: `Exported ${result.totalFiles} files into Google Drive folder. Opened in a new tab.`,
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
          description: err?.message || "Failed to export workspace to Google Drive",
          variant: "destructive",
        });
      }
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
          <header className="sticky top-0 z-20 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#09090B]/85 backdrop-blur-md transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-6 h-15 flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white">
                  Smart MD
                </span>
                <span className="hidden sm:inline text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                  Local-First
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <button
                  onClick={() => handleNewDocument(null)}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold text-xs sm:text-sm px-4 py-2 rounded-lg transition-all shadow-sm"
                >
                  Open Workspace →
                </button>
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
              <button
                onClick={() => {
                  setActiveDocument(null);
                  localStorage.removeItem("smartmd-last-doc-id");
                }}
                className="flex items-center gap-1.5 hover:opacity-70 transition-opacity cursor-pointer"
                title="Back to Home"
              >
                <FileText className="w-5 h-5 text-primary" />
                <h1 className="text-base font-bold tracking-tight">Smart MD</h1>
              </button>
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
                {/* 3-Tab View Mode Switcher */}
                <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/80 text-xs">
                  <button
                    onClick={() => setViewMode("code")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
                      viewMode === "code"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Code Only View"
                  >
                    <Code className="w-3.5 h-3.5" />
                    Code
                  </button>
                  <button
                    onClick={() => setViewMode("split")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
                      viewMode === "split"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Side-by-Side Split View"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Split
                  </button>
                  <button
                    onClick={() => setViewMode("preview")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
                      viewMode === "preview"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Formatted Preview View"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                </div>

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
                    <DropdownMenuContent align="end" className="w-64 bg-popover border-border z-50">
                      {/* ── Docs integrations ── */}
                      <div className="px-2 py-1.5">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Send to Docs</p>
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">Direct via OAuth</span>
                        </div>
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
                              {googleUser ? `Native doc for ${googleUser.email.split("@")[0]}` : "Direct browser-to-Google OAuth"}
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
                            <p className="text-[10px] text-muted-foreground">Direct upload (Smart MD servers never touch your file)</p>
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
                <DropdownMenuContent align="end" className="w-56 bg-popover border-border z-50">
                  <DropdownMenuItem onClick={handleExportWorkspaceToDrive}>
                    <span className="mr-2">☁️</span>
                    Export Workspace to Drive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportWorkspace}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Local Backup (.zip)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleImportWorkspace}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Local Backup (.zip)
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
                      <div className="flex-1 min-w-0 h-full">
                        <MarkdownEditor
                          value={activeDocument.content}
                          onChange={updateDocumentContent}
                          placeholder="Type your Markdown here..."
                          className="h-full"
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
                      <MarkdownEditor
                        value={activeDocument.content}
                        onChange={updateDocumentContent}
                        placeholder="Type your Markdown here..."
                        className="h-full"
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
      {/* Hidden File Input for Open File Button */}
      <input
        type="file"
        ref={localFileInputRef}
        accept=".md,.markdown,text/markdown,text/plain"
        onChange={handleFileInputChange}
        className="hidden"
      />

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
