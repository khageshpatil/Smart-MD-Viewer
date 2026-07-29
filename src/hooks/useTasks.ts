/**
 * Custom hook for managing tasks
 * Provides CRUD operations and real-time state management
 */

import { useState, useEffect, useCallback } from "react";
import {
  Task,
  TaskStatus,
  TaskType,
  getAllTasks,
  getTask,
  createTask as createTaskDB,
  updateTask as updateTaskDB,
  deleteTask as deleteTaskDB,
  searchTasks as searchTasksDB,
  getTasksByStatus,
  getTasksByType,
  getTasksByProject,
} from "@/lib/indexedDB";

export interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  createTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getTaskById: (id: string) => Promise<Task | undefined>;
  searchTasks: (query: string) => Promise<Task[]>;
  filterByStatus: (status: TaskStatus) => Promise<Task[]>;
  filterByType: (type: TaskType) => Promise<Task[]>;
  filterByProject: (projectId: string) => Promise<Task[]>;
  refreshTasks: () => Promise<void>;
  moveTask: (id: string, newStatus: TaskStatus) => Promise<void>;
}

export const useTasks = (): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load all tasks on mount
  const refreshTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allTasks = await getAllTasks();
      setTasks(allTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  // Create a new task
  const createTask = useCallback(
    async (taskData: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<Task> => {
      try {
        const now = Date.now();
        const newTask: Task = {
          ...taskData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };

        await createTaskDB(newTask);
        await refreshTasks();
        return newTask;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to create task";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [refreshTasks]
  );

  // Update an existing task
  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>): Promise<void> => {
      try {
        const existingTask = await getTask(id);
        if (!existingTask) {
          throw new Error("Task not found");
        }

        const updatedTask: Task = {
          ...existingTask,
          ...updates,
          id, // Ensure ID doesn't change
          updatedAt: Date.now(),
        };

        await updateTaskDB(updatedTask);
        await refreshTasks();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update task";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [refreshTasks]
  );

  // Delete a task
  const deleteTask = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteTaskDB(id);
        await refreshTasks();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete task";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [refreshTasks]
  );

  // Get task by ID
  const getTaskById = useCallback(async (id: string): Promise<Task | undefined> => {
    try {
      return await getTask(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get task");
      return undefined;
    }
  }, []);

  // Search tasks
  const searchTasks = useCallback(async (query: string): Promise<Task[]> => {
    try {
      return await searchTasksDB(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search tasks");
      return [];
    }
  }, []);

  // Filter by status
  const filterByStatus = useCallback(async (status: TaskStatus): Promise<Task[]> => {
    try {
      return await getTasksByStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to filter tasks");
      return [];
    }
  }, []);

  // Filter by type
  const filterByType = useCallback(async (type: TaskType): Promise<Task[]> => {
    try {
      return await getTasksByType(type);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to filter tasks");
      return [];
    }
  }, []);

  // Filter by project
  const filterByProject = useCallback(async (projectId: string): Promise<Task[]> => {
    try {
      return await getTasksByProject(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to filter tasks");
      return [];
    }
  }, []);

  // Move task to different status
  const moveTask = useCallback(
    async (id: string, newStatus: TaskStatus): Promise<void> => {
      await updateTask(id, { status: newStatus });
    },
    [updateTask]
  );

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    getTaskById,
    searchTasks,
    filterByStatus,
    filterByType,
    filterByProject,
    refreshTasks,
    moveTask,
  };
};

