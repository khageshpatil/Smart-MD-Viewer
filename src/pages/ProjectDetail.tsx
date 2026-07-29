/**
 * ProjectDetail Page
 * Full project workspace with tabs for Overview, Tasks, Documents, Links
 */

import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SystemModeSwitcher } from "@/components/SystemModeSwitcher";
import { Edit, FileText, CheckSquare, Link as LinkIcon } from "lucide-react";
import { ProjectModal } from "@/components/ProjectModal";
import { useProjects } from "@/hooks/useProjects";
import { Project, getTasksByProject, getDocumentsByProject } from "@/lib/indexedDB";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    projects,
    loading: projectsLoading,
    getProjectById,
    updateProject,
    refreshProjects,
  } = useProjects();

  const [project, setProject] = useState<Project | null>(null);
  const [taskCount, setTaskCount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) {
        navigate("/projects");
        return;
      }

      const loadedProject = await getProjectById(projectId);
      if (!loadedProject) {
        toast({
          title: "Error",
          description: "Project not found",
          variant: "destructive",
        });
        navigate("/projects");
        return;
      }

      setProject(loadedProject);

      // Load counts
      const [tasks, documents] = await Promise.all([
        getTasksByProject(projectId),
        getDocumentsByProject(projectId),
      ]);
      setTaskCount(tasks.length);
      setDocumentCount(documents.length);
    };

    loadProject();
  }, [projectId, getProjectById, navigate, toast]);

  // Handle save project
  const handleSaveProject = useCallback(
    async (updates: Partial<Project>) => {
      if (!project) return;

      try {
        await updateProject(project.id, updates);
        await refreshProjects();
        const updated = await getProjectById(project.id);
        if (updated) {
          setProject(updated);
        }
        toast({
          title: "Success",
          description: "Project updated successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update project",
          variant: "destructive",
        });
      }
    },
    [project, updateProject, getProjectById, refreshProjects, toast]
  );

  if (projectsLoading || !project) {
    return (
      <SidebarProvider>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading project...</p>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  const statusColors: Record<Project["status"], "default" | "secondary" | "outline"> = {
    active: "default",
    paused: "secondary",
    archived: "outline",
  };

  const statusLabels: Record<Project["status"], string> = {
    active: "Active",
    paused: "Paused",
    archived: "Archived",
  };

  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="border-b border-border bg-card px-3 sm:px-4 md:px-6 py-3 flex items-center justify-between gap-2 sticky top-0 z-20">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <h1 className="text-base sm:text-lg md:text-xl font-semibold truncate">{project.name}</h1>
            <Badge variant={statusColors[project.status]} className="flex-shrink-0 text-xs">{statusLabels[project.status]}</Badge>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <SystemModeSwitcher />
            <Button variant="outline" size="sm" onClick={() => setModalOpen(true)} className="hidden sm:flex">
              <Edit className="w-4 h-4 mr-2" />
              Edit Project
            </Button>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(true)} className="sm:hidden" title="Edit Project">
              <Edit className="w-4 h-4" />
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4 flex-wrap h-auto">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs sm:text-sm">
                Tasks <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">{taskCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-xs sm:text-sm">
                Docs <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">{documentCount}</Badge>
                <span className="hidden sm:inline">uments</span>
              </TabsTrigger>
              <TabsTrigger value="links" className="text-xs sm:text-sm">Links</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Description</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.description ? (
                    <div className="prose dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{project.description}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No description provided.</p>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckSquare className="w-5 h-5" />
                      Tasks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{taskCount}</p>
                    <CardDescription>Total tasks in this project</CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{documentCount}</p>
                    <CardDescription>Total documents in this project</CardDescription>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tasks</CardTitle>
                  <CardDescription>Task board will be available in Phase 3</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    The task board for this project will be implemented in Phase 3.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>Document list will be available in Phase 6</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    The document list for this project will be implemented in Phase 6.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="links" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="w-5 h-5" />
                    Links
                  </CardTitle>
                  <CardDescription>External references and PRs</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Link management will be available in a future phase.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        {/* Project Modal */}
        <ProjectModal
          project={project}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveProject}
        />
      </div>
    </SidebarProvider>
  );
};

export default ProjectDetail;

