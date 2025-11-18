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

  // Load data
  useEffect(() => {
    loadData();
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
                  className="group flex items-center gap-2 px-3 py-2 hover:bg-sidebar-accent cursor-pointer rounded-md transition-colors"
                  style={{ paddingLeft: `${depth * 12 + 12}px` }}
                  onClick={() => toggleFolder(folder.id)}
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
                className={`flex items-center gap-2 px-3 py-2 hover:bg-sidebar-accent cursor-pointer rounded-md transition-colors ${
                  isActive ? "bg-sidebar-accent" : ""
                }`}
                style={{ paddingLeft: `${depth * 12 + 28}px` }}
                onClick={() => onDocumentSelect(doc)}
              >
                <FileText className="w-4 h-4 text-sidebar-foreground/60" />
                <span className="text-sm flex-1 truncate text-sidebar-foreground">{doc.title}</span>
                {doc.isPinned && <Star className="w-3 h-3 fill-sidebar-primary text-sidebar-primary" />}
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
              >
                <FileText className="w-3 h-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => onCreateFolder(null)}
                title="New Folder"
              >
                <FolderPlus className="w-3 h-3" />
              </Button>
            </div>
          </div>
          {fileTree.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <FileText className="w-8 h-8 mx-auto mb-3 text-sidebar-foreground/40" />
              <p className="text-sm text-sidebar-foreground/60 mb-3">No documents yet</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onNewDocument(null)}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Create your first document
              </Button>
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
