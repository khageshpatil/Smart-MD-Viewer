import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Star,
  Folder,
  FileText,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  FolderPlus,
  Trash2,
  Edit2,
  Pin,
  Tag as TagIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Document, Folder as FolderType, getAllDocuments, getAllFolders, getPinnedDocuments, searchDocuments } from "@/lib/indexedDB";

interface DocumentSidebarProps {
  onDocumentSelect: (doc: Document) => void;
  onNewDocument: (folderId: string | null) => void;
  onDeleteDocument: (docId: string) => void;
  onRenameDocument: (docId: string, newTitle: string) => void;
  onTogglePin: (docId: string) => void;
  onAddTag: (docId: string) => void;
  onMoveDocument: (docId: string, folderId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onDeleteFolder: (folderId: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  activeDocumentId: string | null;
  currentFolderId: string | null;
}

interface FileTreeItem {
  type: "folder" | "document";
  data: FolderType | Document;
  children?: FileTreeItem[];
}

export const DocumentSidebar = ({
  onDocumentSelect,
  onNewDocument,
  onDeleteDocument,
  onRenameDocument,
  onTogglePin,
  onAddTag,
  onMoveDocument,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  activeDocumentId,
  currentFolderId,
}: DocumentSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [pinnedDocs, setPinnedDocs] = useState<Document[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [renameDialog, setRenameDialog] = useState<{ type: "doc" | "folder"; id: string; name: string } | null>(null);

  // Load data & subscribe to workspace updates
  useEffect(() => {
    loadData();
    const handleWorkspaceUpdate = () => loadData();
    window.addEventListener("workspace-updated", handleWorkspaceUpdate);
    return () => window.removeEventListener("workspace-updated", handleWorkspaceUpdate);
  }, []);

  const loadData = async () => {
    const [allDocs, allFolders, pinned] = await Promise.all([
      getAllDocuments(),
      getAllFolders(),
      getPinnedDocuments(),
    ]);
    setDocuments(allDocs);
    setFolders(allFolders);
    setPinnedDocs(pinned);
  };

  // Auto-expand folder when active document is inside it
  useEffect(() => {
    if (activeDocumentId) {
      const doc = documents.find(d => d.id === activeDocumentId);
      if (doc?.folderId) {
        setExpandedFolders(prev => new Set([...prev, doc.folderId!]));
      }
    }
  }, [activeDocumentId, documents]);

  // Search functionality
  const filteredDocs = useMemo(async () => {
    if (searchQuery.trim()) {
      return await searchDocuments(searchQuery);
    }
    if (selectedTag) {
      return documents.filter((doc) => doc.tags.includes(selectedTag));
    }
    return documents;
  }, [searchQuery, documents, selectedTag]);

  const [displayedDocs, setDisplayedDocs] = useState<Document[]>([]);

  useEffect(() => {
    if (filteredDocs instanceof Promise) {
      filteredDocs.then(setDisplayedDocs);
    } else {
      setDisplayedDocs(filteredDocs);
    }
  }, [filteredDocs]);

  // All unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    documents.forEach((doc) => doc.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [documents]);

  // Build folder tree
  const buildTree = (parentId: string | null): FileTreeItem[] => {
    const items: FileTreeItem[] = [];

    // Add folders
    folders
      .filter((f) => f.parentId === parentId)
      .forEach((folder) => {
        items.push({
          type: "folder",
          data: folder,
          children: buildTree(folder.id),
        });
      });

    // Add documents
    displayedDocs
      .filter((d) => d.folderId === parentId)
      .forEach((doc) => {
        items.push({
          type: "document",
          data: doc,
        });
      });

    return items;
  };

  const fileTree = buildTree(null);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const renderTree = (items: FileTreeItem[], depth = 0) => {
    return items.map((item) => {
      if (item.type === "folder") {
        const folder = item.data as FolderType;
        const isExpanded = expandedFolders.has(folder.id);

        return (
          <div key={folder.id}>
            <ContextMenu>
              <ContextMenuTrigger>
                <div
                  role="treeitem"
                  aria-expanded={isExpanded}
                  aria-label={`Folder: ${folder.name}`}
                  tabIndex={0}
                  className="group flex items-center gap-2 px-3 py-2 hover:bg-sidebar-accent cursor-pointer rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none"
                  style={{ paddingLeft: `${depth * 12 + 12}px` }}
                  onClick={() => toggleFolder(folder.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleFolder(folder.id);
                    }
                  }}
                  title="Right-click for options"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-sidebar-foreground/60" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-sidebar-foreground/60" />
                  )}
                  <Folder className="w-4 h-4 text-sidebar-primary" />
                  <span className="text-sm flex-1 truncate text-sidebar-foreground">{folder.name}</span>
                  <Plus className="w-3 h-3 text-sidebar-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="bg-popover border-border">
                <ContextMenuItem onClick={() => onNewDocument(folder.id)}>
                  <FileText className="w-4 h-4 mr-2" />
                  New Document
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onCreateFolder(folder.id)}>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  New Subfolder
                </ContextMenuItem>
                <ContextMenuItem onClick={() => setRenameDialog({ type: "folder", id: folder.id, name: folder.name })}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Rename
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onDeleteFolder(folder.id)} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
            {isExpanded && item.children && <div>{renderTree(item.children, depth + 1)}</div>}
          </div>
        );
      } else {
        const doc = item.data as Document;
        const isActive = doc.id === activeDocumentId;

        return (
          <ContextMenu key={doc.id}>
            <ContextMenuTrigger>
              <div
                role="treeitem"
                aria-selected={isActive}
                aria-label={`Document: ${doc.title}`}
                tabIndex={0}
                className={`group flex items-center gap-2 px-3 py-1.5 hover:bg-sidebar-accent cursor-pointer rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                  isActive ? "bg-sidebar-accent" : ""
                }`}
                style={{ paddingLeft: `${depth * 12 + 28}px` }}
                onClick={() => onDocumentSelect(doc)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onDocumentSelect(doc);
                  }
                }}
              >
                <FileText className={`w-4 h-4 shrink-0 ${isActive ? "text-sidebar-primary" : "text-sidebar-foreground/60"}`} />
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  <span className={`text-sm truncate transition-colors ${isActive ? "font-semibold text-sidebar-foreground" : "text-sidebar-foreground"}`}>
                    {doc.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground/80 truncate">
                    {new Date(doc.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {doc.isPinned && <Star className="w-3 h-3 shrink-0 fill-sidebar-primary text-sidebar-primary" />}
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="bg-popover border-border">
              <ContextMenuItem onClick={() => setRenameDialog({ type: "doc", id: doc.id, name: doc.title })}>
                <Edit2 className="w-4 h-4 mr-2" />
                Rename
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onTogglePin(doc.id)}>
                <Pin className="w-4 h-4 mr-2" />
                {doc.isPinned ? "Unpin" : "Pin to Favorites"}
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onAddTag(doc.id)}>
                <TagIcon className="w-4 h-4 mr-2" />
                Add Tag
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onDeleteDocument(doc.id)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        );
      }
    });
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Button onClick={() => onNewDocument(currentFolderId)} className="w-full" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Page
        </Button>
        
        {/* Search Bar */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-sidebar-foreground/60" />
          <Input
            type="text"
            placeholder="Search documents..."
            aria-label="Search documents"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/60"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="flex-1">
        {/* Favorites Section */}
        {pinnedDocs.length > 0 && (
          <div className="p-3 border-b border-sidebar-border">
            <div className="flex items-center gap-2 mb-2 px-3 py-1">
              <Star className="w-4 h-4 text-sidebar-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/80">Favorites</span>
            </div>
            {pinnedDocs.map((doc) => (
              <div
                key={doc.id}
                className={`flex items-center gap-2 px-3 py-2 hover:bg-sidebar-accent cursor-pointer rounded-md transition-colors ${
                  doc.id === activeDocumentId ? "bg-sidebar-accent" : ""
                }`}
                onClick={() => onDocumentSelect(doc)}
              >
                <FileText className="w-4 h-4 text-sidebar-foreground/60" />
                <span className="text-sm flex-1 truncate text-sidebar-foreground">{doc.title}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <div className="p-3 border-b border-sidebar-border">
            <div className="flex items-center gap-2 mb-2 px-3 py-1">
              <TagIcon className="w-4 h-4 text-sidebar-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/80">Tags</span>
            </div>
            <div className="flex flex-wrap gap-1 px-3">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* My Documents Section */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2 px-3 py-1">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-sidebar-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/80">My Documents</span>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => onNewDocument(null)}
                title="New Document"
                aria-label="Create new document at root"
              >
                <FileText className="w-3 h-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => onCreateFolder(null)}
                title="New Folder"
                aria-label="Create new folder at root"
              >
                <FolderPlus className="w-3 h-3" />
              </Button>
            </div>
          </div>
          {fileTree.length === 0 ? (
            <div className="px-3 py-10 text-center flex flex-col items-center gap-3">
              {/* Illustrated empty state */}
              <div className="relative w-14 h-14 mb-1">
                <div className="absolute inset-0 rounded-xl bg-sidebar-primary/10 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-sidebar-primary/60" />
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
                  <Plus className="w-3 h-3 text-sidebar-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-sidebar-foreground/80">No documents yet</p>
                <p className="text-xs text-sidebar-foreground/50 max-w-[160px] mx-auto leading-relaxed">
                  Create your first document or drag a <code className="font-mono bg-sidebar-accent px-0.5 rounded">.md</code> file here
                </p>
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onNewDocument(null)}
                  className="text-xs w-full"
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  New Document
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCreateFolder(null)}
                  className="text-xs w-full"
                >
                  <FolderPlus className="w-3.5 h-3.5 mr-1.5" />
                  New Folder
                </Button>
              </div>
            </div>
          ) : (
            renderTree(fileTree)
          )}
        </div>
      </ScrollArea>
      </SidebarContent>

      {/* Rename Dialog */}
      {renameDialog && (
        <Dialog open={!!renameDialog} onOpenChange={() => setRenameDialog(null)}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Rename {renameDialog.type === "doc" ? "Document" : "Folder"}</DialogTitle>
            </DialogHeader>
            <Input
              value={renameDialog.name}
              onChange={(e) => setRenameDialog({ ...renameDialog, name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (renameDialog.type === "doc") {
                    onRenameDocument(renameDialog.id, renameDialog.name);
                  } else {
                    onRenameFolder(renameDialog.id, renameDialog.name);
                  }
                  setRenameDialog(null);
                }
              }}
              className="bg-background border-input text-foreground"
              autoFocus
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenameDialog(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (renameDialog.type === "doc") {
                    onRenameDocument(renameDialog.id, renameDialog.name);
                  } else {
                    onRenameFolder(renameDialog.id, renameDialog.name);
                  }
                  setRenameDialog(null);
                }}
              >
                Rename
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Sidebar>
  );
};

export const notifyWorkspaceUpdated = () => {
  window.dispatchEvent(new CustomEvent("workspace-updated"));
};
