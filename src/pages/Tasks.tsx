/**
 * Tasks Page
 * Main page for task management system
 */

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SystemModeSwitcher } from "@/components/SystemModeSwitcher";
import { Plus, Github, FileText, CheckSquare } from "lucide-react";
import { TaskBoard } from "@/components/TaskBoard";
import { TaskModal } from "@/components/TaskModal";
import { GitHubConnect } from "@/components/GitHubConnect";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useGitHub } from "@/hooks/useGitHub";
import { Task, TaskStatus } from "@/lib/indexedDB";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Tasks = () => {
  const { toast } = useToast();

  // Hooks
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    refreshTasks,
  } = useTasks();

  const {
    projects,
    loading: projectsLoading,
  } = useProjects();

  const {
    authenticated,
    user,
    loading: githubLoading,
    error: githubError,
    authenticateWithToken,
    logout,
    fetchRepos,
    fetchPRs,
    getPRDetails,
  } = useGitHub();

  // State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialStatus, setInitialStatus] = useState<TaskStatus | undefined>(undefined);
  const [initialProjectId, setInitialProjectId] = useState<string | undefined>(undefined);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [githubPanelOpen, setGithubPanelOpen] = useState(false);

  // Map PR status to Task status
  const mapPRStatusToTaskStatus = (prStatus: "open" | "closed" | "merged"): TaskStatus => {
    switch (prStatus) {
      case "open":
        return "review";
      case "merged":
        return "done";
      case "closed":
        return "todo";
      default:
        return "todo";
    }
  };

  // Show errors in toasts
  useEffect(() => {
    if (tasksError) {
      toast({
        title: "Error",
        description: tasksError,
        variant: "destructive",
      });
    }
  }, [tasksError, toast]);

  useEffect(() => {
    if (githubError) {
      toast({
        title: "GitHub Error",
        description: githubError,
        variant: "destructive",
      });
    }
  }, [githubError, toast]);

  // Handle task click
  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setInitialStatus(undefined);
    setInitialProjectId(undefined);
    setModalOpen(true);
  }, []);

  // Handle create task
  const handleCreateTask = useCallback((status: TaskStatus, projectId?: string) => {
    setSelectedTask(null);
    setInitialStatus(status);
    setInitialProjectId(projectId);
    setModalOpen(true);
  }, []);

  // Handle save task
  const handleSaveTask = useCallback(
    async (updates: Partial<Task>) => {
      try {
        if (selectedTask) {
          // Update existing task
          await updateTask(selectedTask.id, updates);
          toast({
            title: "Success",
            description: "Task updated successfully",
          });
        } else {
          // Create new task
          if (!updates.projectId) {
            toast({
              title: "Error",
              description: "Project is required",
              variant: "destructive",
            });
            return;
          }
          await createTask({
            title: updates.title || "",
            description: updates.description || "",
            status: updates.status || initialStatus || "todo",
            type: updates.type || "build",
            projectId: updates.projectId,
            tags: updates.tags || [],
            linkedDocumentIds: updates.linkedDocumentIds || [],
            linkedPRs: updates.linkedPRs || [],
          });
          toast({
            title: "Success",
            description: "Task created successfully",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to save task",
          variant: "destructive",
        });
      }
    },
    [selectedTask, initialStatus, createTask, updateTask, toast]
  );

  // Handle delete task
  const handleDeleteTask = useCallback(
    async (id: string) => {
      try {
        await deleteTask(id);
        toast({
          title: "Success",
          description: "Task deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete task",
          variant: "destructive",
        });
      }
    },
    [deleteTask, toast]
  );

  // Handle move task (drag and drop)
  const handleMoveTask = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      try {
        await moveTask(taskId, newStatus);
        toast({
          title: "Success",
          description: "Task moved successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to move task",
          variant: "destructive",
        });
      }
    },
    [moveTask, toast]
  );

  // Handle GitHub authentication
  const handleGitHubAuth = useCallback(
    async (token: string) => {
      await authenticateWithToken(token);
      toast({
        title: "Success",
        description: "Connected to GitHub successfully",
      });
    },
    [authenticateWithToken, toast]
  );

  // Handle GitHub logout
  const handleGitHubLogout = useCallback(() => {
    logout();
    toast({
      title: "Disconnected",
      description: "Disconnected from GitHub",
    });
  }, [logout, toast]);

  // Handle link PR (for use in PR panel)
  const handleLinkPR = useCallback(
    async (prUrl: string) => {
      if (selectedTask) {
        const updatedPRs = [...selectedTask.linkedPRs];
        if (!updatedPRs.includes(prUrl)) {
          updatedPRs.push(prUrl);
          try {
            await updateTask(selectedTask.id, { linkedPRs: updatedPRs });
            // Update local state to reflect the change immediately
            setSelectedTask({ ...selectedTask, linkedPRs: updatedPRs });
            toast({
              title: "Success",
              description: "PR linked to task",
            });
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to link PR",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Already Linked",
            description: "This PR is already linked to the task",
          });
        }
      }
    },
    [selectedTask, updateTask, toast]
  );

  // Sync PR status with task status
  const handleSyncPRStatus = useCallback(async () => {
    if (!authenticated) {
      toast({
        title: "Not Connected",
        description: "Please connect to GitHub first",
        variant: "destructive",
      });
      return;
    }

    try {
      let syncCount = 0;

      for (const task of tasks) {
        if (task.linkedPRs.length > 0) {
          // Check the first linked PR's status
          const prUrl = task.linkedPRs[0];
          const prDetails = await getPRDetails(prUrl);

          if (prDetails) {
            const newStatus = mapPRStatusToTaskStatus(prDetails.status);
            if (newStatus !== task.status) {
              await moveTask(task.id, newStatus);
              syncCount++;
            }
          }
        }
      }

      if (syncCount > 0) {
        toast({
          title: "Sync Complete",
          description: `Updated ${syncCount} task(s) based on PR status`,
        });
        await refreshTasks();
      } else {
        toast({
          title: "Already in Sync",
          description: "All tasks are up to date",
        });
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync PR status",
        variant: "destructive",
      });
    }
  }, [
    authenticated,
    tasks,
    getPRDetails,
    mapPRStatusToTaskStatus,
    moveTask,
    refreshTasks,
    toast,
  ]);

  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen w-full">
        {/* Header */}
        <header className="border-b border-border bg-card px-3 sm:px-4 md:px-6 py-3 flex items-center justify-between gap-2 sticky top-0 z-20">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <h1 className="text-base sm:text-lg md:text-xl font-semibold truncate">Tasks</h1>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <SystemModeSwitcher />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCreateTask("todo")}
              className="hidden sm:flex"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCreateTask("todo")}
              className="sm:hidden"
              title="New Task"
            >
              <Plus className="w-4 h-4" />
            </Button>

            <Sheet open={githubPanelOpen} onOpenChange={setGithubPanelOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </Button>
              </SheetTrigger>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="sm:hidden" title="GitHub">
                  <Github className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:w-[500px] md:w-[600px] overflow-y-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle>GitHub Integration</SheetTitle>
                  <SheetDescription>
                    Connect to GitHub and manage pull requests
                  </SheetDescription>
                </SheetHeader>

                <Tabs defaultValue="connect">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="connect">Connection</TabsTrigger>
                    <TabsTrigger value="prs" disabled={!authenticated}>
                      Pull Requests
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="connect" className="space-y-4 mt-4">
                    <GitHubConnect
                      authenticated={authenticated}
                      user={user}
                      loading={githubLoading}
                      onAuthenticate={handleGitHubAuth}
                      onLogout={handleGitHubLogout}
                    />

                    {authenticated && (
                      <Button onClick={handleSyncPRStatus} className="w-full">
                        Sync PR Status with Tasks
                      </Button>
                    )}
                  </TabsContent>

                  <TabsContent value="prs" className="mt-4">
                    {authenticated ? (
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          Open a task to link pull requests directly from the task editor.
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        Connect to GitHub first
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </SheetContent>
            </Sheet>

            <ThemeToggle />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden p-3 sm:p-4 md:p-6 w-full">
          {tasksLoading || projectsLoading ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading tasks...</p>
              </div>
            </div>
          ) : (
            <TaskBoard
              tasks={tasks}
              onTaskClick={handleTaskClick}
              onMoveTask={handleMoveTask}
              onCreateTask={(status) => handleCreateTask(status, selectedProjectId || undefined)}
              projects={projects}
              selectedProjectId={selectedProjectId}
              onProjectChange={setSelectedProjectId}
            />
          )}
        </main>

        {/* Task Modal */}
        <TaskModal
          task={selectedTask}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedTask(null);
            setInitialStatus(undefined);
            setInitialProjectId(undefined);
          }}
          onSave={handleSaveTask}
          onDelete={selectedTask ? handleDeleteTask : undefined}
          initialStatus={initialStatus}
          initialProjectId={initialProjectId}
          projects={projects}
          authenticated={authenticated}
          onFetchRepos={fetchRepos}
          onFetchPRs={fetchPRs}
          onLinkPR={handleLinkPR}
        />
      </div>
    </SidebarProvider>
  );
};

export default Tasks;

