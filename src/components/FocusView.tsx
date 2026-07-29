/**
 * FocusView Component
 * Main focus view layout showing active tasks and project overview
 */

import { Task, Project } from "@/lib/indexedDB";
import { TaskColumn } from "./TaskColumn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, CheckSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Code } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface FocusViewProps {
  project: Project | null;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onMoveTask: (taskId: string, newStatus: Task["status"]) => void;
  onCreateTask: (status: Task["status"]) => void;
  onCreateDocument: () => void;
  onUpdateProjectDescription?: (description: string) => void;
}

export const FocusView = ({
  project,
  tasks,
  onTaskClick,
  onMoveTask,
  onCreateTask,
  onCreateDocument,
  onUpdateProjectDescription,
}: FocusViewProps) => {
  const [overviewCollapsed, setOverviewCollapsed] = useState(true); // Collapsed by default for execution focus
  const [descriptionEditMode, setDescriptionEditMode] = useState(false);
  const [description, setDescription] = useState(project?.description || "");

  // Filter tasks for "In Progress" and "Review" columns
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
  const reviewTasks = tasks.filter((t) => t.status === "review");

  // Update description when project changes
  useEffect(() => {
    if (project) {
      setDescription(project.description);
    }
  }, [project]);

  const handleSaveDescription = () => {
    if (onUpdateProjectDescription && project) {
      onUpdateProjectDescription(description);
      setDescriptionEditMode(false);
    }
  };

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[400px]">
        <div className="p-4 rounded-full bg-muted/30 mb-4">
          <CheckSquare className="w-12 h-12 text-muted-foreground/60" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-foreground">Choose what to focus on</h2>
        <p className="text-muted-foreground mb-1 max-w-md text-sm">
          Select a project to enter execution mode and see your active work.
        </p>
        <p className="text-muted-foreground/70 text-xs max-w-md mt-2">
          Focus shows in-progress and review tasks only.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Execution Surface - In Progress and Review Columns */}
      <div>
        <div className="mb-4">
          <h2 className="text-base sm:text-lg font-medium text-foreground">Active Work</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="min-h-[250px] sm:min-h-[300px]">
            <TaskColumn
              status="in-progress"
              title="In Progress"
              tasks={inProgressTasks}
              onTaskClick={onTaskClick}
              onDrop={onMoveTask}
              onCreateTask={onCreateTask}
            />
          </div>
          <div className="min-h-[250px] sm:min-h-[300px]">
            <TaskColumn
              status="review"
              title="Review"
              tasks={reviewTasks}
              onTaskClick={onTaskClick}
              onDrop={onMoveTask}
              onCreateTask={onCreateTask}
            />
          </div>
        </div>
      </div>

      {/* Project Overview - Collapsible (Collapsed by default for execution focus) */}
      <Collapsible open={!overviewCollapsed} onOpenChange={(open) => setOverviewCollapsed(!open)}>
        <Card className="border-muted/50">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">Project Overview</CardTitle>
                  <CardDescription className="text-xs">{project.name}</CardDescription>
                </div>
                {overviewCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {descriptionEditMode ? (
                <div className="space-y-3">
                  <Tabs defaultValue="edit" className="w-full">
                    <TabsList className="mb-3">
                      <TabsTrigger value="edit">
                        <Code className="w-4 h-4 mr-2" />
                        Edit
                      </TabsTrigger>
                      <TabsTrigger value="preview">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="edit">
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter project description (markdown supported)..."
                        className="min-h-[200px] font-mono text-sm"
                      />
                    </TabsContent>
                    <TabsContent value="preview">
                      <ScrollArea className="min-h-[200px] border rounded-md p-4">
                        {description.trim() ? (
                          <div className="prose dark:prose-invert max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({
                                  inline,
                                  className,
                                  children,
                                  ...props
                                }: React.ComponentPropsWithoutRef<"code"> & {
                                  inline?: boolean;
                                }) {
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
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No description provided</p>
                        )}
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveDescription}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDescription(project.description);
                        setDescriptionEditMode(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {description.trim() ? (
                    <div className="prose dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No description provided.</p>
                  )}
                  {onUpdateProjectDescription && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDescriptionEditMode(true)}
                    >
                      Edit Description
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

