/**
 * Custom hook for managing projects
 * Provides CRUD operations and real-time state management
 */

import { useState, useEffect, useCallback } from "react";
import {
  Project,
  getAllProjects,
  getProject,
  saveProject,
  deleteProject as deleteProjectDB,
  getProjectsByStatus,
  getActiveProject,
} from "@/lib/indexedDB";

export interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  createProject: (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProjectById: (id: string) => Promise<Project | undefined>;
  getActive: () => Promise<Project | undefined>;
  getByStatus: (status: Project["status"]) => Promise<Project[]>;
  refreshProjects: () => Promise<void>;
  setActive: (id: string) => Promise<void>;
}

export const useProjects = (): UseProjectsReturn => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load all projects on mount
  const refreshProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allProjects = await getAllProjects();
      setProjects(allProjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  // Create a new project
  const createProject = useCallback(
    async (projectData: Omit<Project, "id" | "createdAt" | "updatedAt">): Promise<Project> => {
      try {
        const now = Date.now();
        const newProject: Project = {
          ...projectData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };

        await saveProject(newProject);
        await refreshProjects();
        return newProject;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to create project";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [refreshProjects]
  );

  // Update an existing project
  const updateProject = useCallback(
    async (id: string, updates: Partial<Project>): Promise<void> => {
      try {
        const existingProject = await getProject(id);
        if (!existingProject) {
          throw new Error("Project not found");
        }

        const updatedProject: Project = {
          ...existingProject,
          ...updates,
          id, // Ensure ID doesn't change
          updatedAt: Date.now(),
        };

        await saveProject(updatedProject);
        await refreshProjects();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update project";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [refreshProjects]
  );

  // Delete a project
  const deleteProject = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteProjectDB(id);
        await refreshProjects();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete project";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [refreshProjects]
  );

  // Get project by ID
  const getProjectById = useCallback(async (id: string): Promise<Project | undefined> => {
    try {
      return await getProject(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get project");
      return undefined;
    }
  }, []);

  // Get active project
  const getActive = useCallback(async (): Promise<Project | undefined> => {
    try {
      return await getActiveProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get active project");
      return undefined;
    }
  }, []);

  // Get projects by status
  const getByStatus = useCallback(async (status: Project["status"]): Promise<Project[]> => {
    try {
      return await getProjectsByStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to filter projects");
      return [];
    }
  }, []);

  // Set a project as active (sets all others to paused or archived)
  const setActive = useCallback(
    async (id: string): Promise<void> => {
      try {
        // Set all active projects to paused
        const activeProjects = await getProjectsByStatus("active");
        for (const project of activeProjects) {
          if (project.id !== id) {
            await saveProject({
              ...project,
              status: "paused",
              updatedAt: Date.now(),
            });
          }
        }

        // Set the selected project to active
        const project = await getProject(id);
        if (project) {
          await saveProject({
            ...project,
            status: "active",
            updatedAt: Date.now(),
          });
        }

        await refreshProjects();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to set active project";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [refreshProjects]
  );

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
    getActive,
    getByStatus,
    refreshProjects,
    setActive,
  };
};

