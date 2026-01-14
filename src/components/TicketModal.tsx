/**
 * TicketModal Component
 * Full-featured modal for viewing and editing tickets
 */

import { useState, useEffect } from "react";
import { Ticket, TicketStatus, TicketPriority, GitHubPR } from "@/lib/indexedDB";
import { GitHubRepo } from "@/lib/github";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X, Save, Trash2, Eye, Code, GitPullRequest, Plus, Github } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { GitHubPRPanel } from "./GitHubPRPanel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TicketModalProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Ticket>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialStatus?: TicketStatus;
  // GitHub integration (optional)
  authenticated?: boolean;
  onFetchRepos?: () => Promise<GitHubRepo[]>;
  onFetchPRs?: (owner: string, repo: string) => Promise<GitHubPR[]>;
  onLinkPR?: (prUrl: string) => void;
}

export const TicketModal = ({
  ticket,
  open,
  onClose,
  onSave,
  onDelete,
  initialStatus,
  authenticated,
  onFetchRepos,
  onFetchPRs,
  onLinkPR,
}: TicketModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TicketStatus>("todo");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [assignee, setAssignee] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [linkedPRs, setLinkedPRs] = useState<string[]>([]);
  const [prInput, setPrInput] = useState("");
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize form when ticket changes
  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title);
      setDescription(ticket.description);
      setStatus(ticket.status);
      setPriority(ticket.priority);
      setAssignee(ticket.assignee || "");
      setTags([...ticket.tags]);
      setLinkedPRs([...ticket.linkedPRs]);
    } else if (initialStatus) {
      // New ticket with initial status
      setTitle("");
      setDescription("");
      setStatus(initialStatus);
      setPriority("medium");
      setAssignee("");
      setTags([]);
      setLinkedPRs([]);
    }
  }, [ticket, initialStatus]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleAddPR = () => {
    const trimmed = prInput.trim();
    if (trimmed && !linkedPRs.includes(trimmed)) {
      setLinkedPRs([...linkedPRs, trimmed]);
      setPrInput("");
    }
  };

  const handleRemovePR = (pr: string) => {
    setLinkedPRs(linkedPRs.filter((p) => p !== pr));
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    setSaving(true);
    try {
      const updates: Partial<Ticket> = {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assignee: assignee.trim() || null,
        tags,
        linkedPRs,
      };

      await onSave(updates);
      onClose();
    } catch (error) {
      console.error("Failed to save ticket:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!ticket || !onDelete) return;
    
    try {
      await onDelete(ticket.id);
      setShowDeleteDialog(false);
      onClose();
    } catch (error) {
      console.error("Failed to delete ticket:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{ticket ? "Edit Ticket" : "Create Ticket"}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4" onKeyDown={handleKeyDown}>
            {/* Title */}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter ticket title..."
                className="mt-1"
              />
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as TicketStatus)}>
                  <SelectTrigger id="status" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="in-review">In Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as TicketPriority)}
                >
                  <SelectTrigger id="priority" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assignee */}
            <div>
              <Label htmlFor="assignee">Assignee</Label>
              <Input
                id="assignee"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Enter assignee name..."
                className="mt-1"
              />
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add tag..."
                />
                <Button type="button" onClick={handleAddTag} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Description with Preview */}
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <Label>Description</Label>
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "edit" | "preview")}>
                  <TabsList className="h-8">
                    <TabsTrigger value="edit" className="text-xs">
                      <Code className="w-3 h-3 mr-1" />
                      Edit
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {viewMode === "edit" ? (
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter ticket description (markdown supported)..."
                  className="flex-1 min-h-[200px] font-mono text-sm"
                />
              ) : (
                <ScrollArea className="flex-1 border rounded-md p-4">
                  {description.trim() ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ inline, className, children, ...props }: React.ComponentPropsWithoutRef<"code"> & { inline?: boolean }) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={oneDark}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {description}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-sm text-muted-foreground">No description provided</p>
                  )}
                </ScrollArea>
              )}
            </div>

            {/* Linked PRs */}
            <div>
              <Label className="flex items-center gap-1">
                <GitPullRequest className="w-4 h-4" />
                Linked Pull Requests
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={prInput}
                  onChange={(e) => setPrInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddPR();
                    }
                  }}
                  placeholder="Paste GitHub PR URL..."
                />
                <Button type="button" onClick={handleAddPR} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {linkedPRs.length > 0 && (
                <div className="space-y-1 mt-2">
                  {linkedPRs.map((pr) => (
                    <div
                      key={pr}
                      className="flex items-center justify-between text-sm bg-muted p-2 rounded"
                    >
                      <a
                        href={pr}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline truncate"
                      >
                        {pr}
                      </a>
                      <X
                        className="w-4 h-4 cursor-pointer flex-shrink-0 ml-2"
                        onClick={() => handleRemovePR(pr)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* GitHub PR Browser */}
              {authenticated && onFetchRepos && onFetchPRs && onLinkPR && (
                <>
                  <Separator className="my-4" />
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full" type="button">
                        <Github className="w-4 h-4 mr-2" />
                        Browse GitHub PRs
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3">
                      <GitHubPRPanel
                        onFetchRepos={onFetchRepos}
                        onFetchPRs={onFetchPRs}
                        onLinkPR={(url) => {
                          onLinkPR(url);
                          // Also add to local state
                          if (!linkedPRs.includes(url)) {
                            setLinkedPRs([...linkedPRs, url]);
                          }
                        }}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {ticket && onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!title.trim() || saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the ticket.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
