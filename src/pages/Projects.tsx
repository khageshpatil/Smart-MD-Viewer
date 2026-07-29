/**
 * Projects Page
 * Main page for managing all projects
 */

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SystemModeSwitcher } from "@/components/SystemModeSwitcher";
import { Plus, FolderKanban } from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectModal } from "@/components/ProjectModal";
import { useProjects } from "@/hooks/useProjects";
import { Project } from "@/lib/indexedDB";
import { useToast } from "@/hooks/use-toast";
import { getTasksByProject, getDocumentsByProject } from "@/lib/indexedDB";

const Projects = () => {
  const { toast } = useToast();

  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    createProject,
    updateProject,
    deleteProject,
    setActive,
    refreshProjects,
  } = useProjects();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [projectStats, setProjectStats] = useState<Record<string, { tasks: number; documents: number }>>({});

  // Load project stats (task and document counts)
  useEffect(() => {
    const loadStats = async () => {
      const stats: Record<string, { tasks: number; documents: number }> = {};
      for (const project of projects) {
        const [tasks, documents] = await Promise.all([
          getTasksByProject(project.id),
          getDocumentsByProject(project.id),
        ]);
        stats[project.id] = {
          tasks: tasks.length,
          documents: documents.length,
        };
      }
      setProjectStats(stats);
    };

    if (projects.length > 0) {
      loadStats();
    }
  }, [projects]);

  // Show errors in toasts
  useEffect(() => {
    if (projectsError) {
      toast({
        title: "Error",
        description: projectsError,
        variant: "destructive",
      });
    }
  }, [projectsError, toast]);

  // Handle create project
  const handleCreateProject = useCallback(() => {
    setSelectedProject(null);
    setModalOpen(true);
  }, []);

  // Handle edit project
  const handleEditProject = useCallback((project: Project) => {
    setSelectedProject(project);
    setModalOpen(true);
  }, []);

  // Handle save project
  const handleSaveProject = useCallback(
    async (updates: Partial<Project>) => {
      try {
        if (selectedProject) {
          // Update existing project
          await updateProject(selectedProject.id, updates);
          toast({
            title: "Success",
            description: "Project updated successfully",
          });
        } else {
          // Create new project
          await createProject({
            name: updates.name || "",
            description: updates.description || "",
            status: updates.status || "active",
          });
          toast({
            title: "Success",
            description: "Project created successfully",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to save project",
          variant: "destructive",
        });
      }
    },
    [selectedProject, createProject, updateProject, toast]
  );

  // Handle delete project
  const handleDeleteProject = useCallback(
    async (id: string) => {
      try {
        await deleteProject(id);
        toast({
          title: "Success",
          description: "Project deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete project",
          variant: "destructive",
        });
      }
    },
    [deleteProject, toast]
  );

  // Handle set active
  const handleSetActive = useCallback(
    async (id: string) => {
      try {
        await setActive(id);
        toast({
          title: "Success",
          description: "Project set as active",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to set active project",
          variant: "destructive",
        });
      }
    },
    [setActive, toast]
  );

  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen w-full">
        {/* Header */}
        <header className="border-b border-border bg-card px-3 sm:px-4 md:px-6 py-3 flex items-center justify-between gap-2 sticky top-0 z-20">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <FolderKanban className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <h1 className="text-base sm:text-lg md:text-xl font-semibold truncate">Projects</h1>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <SystemModeSwitcher />
            <Button onClick={handleCreateProject} className="hidden sm:flex">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
            <Button onClick={handleCreateProject} className="sm:hidden" size="sm" title="New Project">
              <Plus className="w-4 h-4" />
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 w-full">
          {projectsLoading ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading projects...</p>
              </div>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center w-full">
              <div className="p-6 rounded-full bg-muted/50 mb-6">
                <FolderKanban className="w-16 h-16 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No Projects Yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Create your first project to organize your tasks and documents.
              </p>
              <Button onClick={handleCreateProject}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={handleEditProject}
                  onDelete={handleDeleteProject}
                  onSetActive={handleSetActive}
                  taskCount={projectStats[project.id]?.tasks || 0}
                  documentCount={projectStats[project.id]?.documents || 0}
                />
              ))}
            </div>
          )}
        </main>

        {/* Project Modal */}
        <ProjectModal
          project={selectedProject}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedProject(null);
          }}
          onSave={handleSaveProject}
          onDelete={selectedProject ? handleDeleteProject : undefined}
        />
      </div>
    </SidebarProvider>
  );
};

export default Projects;

