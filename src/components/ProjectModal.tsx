/**
 * ProjectModal Component
 * Modal for creating and editing projects
 */

import { useState, useEffect } from "react";
import { Project } from "@/lib/indexedDB";
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
import { Save, Trash2, Eye, Code, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
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

interface ProjectModalProps {
  project: Project | null;
  open: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Project>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onGeneratePlan?: (projectId: string) => void;
}

export const ProjectModal = ({
  project,
  open,
  onClose,
  onSave,
  onDelete,
  onGeneratePlan,
}: ProjectModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Project["status"]>("active");
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize form when project changes
  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description);
      setStatus(project.status);
    } else {
      // New project
      setName("");
      setDescription("");
      setStatus("active");
    }
  }, [project]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      const updates: Partial<Project> = {
        name: name.trim(),
        description: description.trim(),
        status,
      };

      await onSave(updates);
      onClose();
    } catch (error) {
      console.error("Failed to save project:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!project || !onDelete) return;

    try {
      await onDelete(project.id);
      setShowDeleteDialog(false);
      onClose();
    } catch (error) {
      console.error("Failed to delete project:", error);
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
        <DialogContent className="max-w-3xl max-h-[90vh] w-[95vw] sm:w-full flex flex-col">
          <DialogHeader>
            <DialogTitle>{project ? "Edit Project" : "Create Project"}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4" onKeyDown={handleKeyDown}>
            {/* Name */}
            <div>
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter project name..."
                className="mt-1"
                autoFocus
              />
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Project["status"])}>
                <SelectTrigger id="status" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
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
                  placeholder="Enter project description (markdown supported)..."
                  className="flex-1 min-h-[200px] font-mono text-sm"
                />
              ) : (
                <ScrollArea className="flex-1 border rounded-md p-4">
                  {description.trim() ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({
                          inline,
                          className,
                          children,
                          ...props
                        }: React.ComponentPropsWithoutRef<"code"> & { inline?: boolean }) {
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
          </div>

          <DialogFooter className="flex flex-col sm:flex-row justify-between gap-2">
            <div className="w-full sm:w-auto flex gap-2">
              {project && onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              {project && onGeneratePlan && name.trim() && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onClose();
                    onGeneratePlan(project.id);
                  }}
                  className="w-full sm:w-auto"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Plan
                </Button>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-initial">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!name.trim() || saving} className="flex-1 sm:flex-initial">
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
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project. Tasks and documents in this project will not be deleted, but they will become unassigned.
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

