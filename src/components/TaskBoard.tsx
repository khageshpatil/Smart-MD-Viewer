/**
 * TaskBoard Component
 * Main Kanban board layout with all columns
 */

import { useState, useMemo } from "react";
import { Task, TaskStatus, TaskType } from "@/lib/indexedDB";
import { TaskColumn } from "./TaskColumn";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Project } from "@/lib/indexedDB";

interface TaskBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
  onCreateTask: (status: TaskStatus) => void;
  projects?: Project[];
  selectedProjectId?: string | null;
  onProjectChange?: (projectId: string | null) => void;
}

const columns: { status: TaskStatus; title: string }[] = [
  { status: "todo", title: "To Do" },
  { status: "in-progress", title: "In Progress" },
  { status: "review", title: "Review" },
  { status: "done", title: "Done" },
];

export const TaskBoard = ({
  tasks,
  onTaskClick,
  onMoveTask,
  onCreateTask,
  projects = [],
  selectedProjectId,
  onProjectChange,
}: TaskBoardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<TaskType[]>([]);

  // Extract all unique tags from tasks
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach((task) => {
      task.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [tasks]);

  // Filter tasks based on search, filters, and project
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Project filter
    if (selectedProjectId) {
      filtered = filtered.filter((task) => task.projectId === selectedProjectId);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((task) =>
        selectedTags.some((tag) => task.tags.includes(tag))
      );
    }

    // Type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((task) => selectedTypes.includes(task.type));
    }

    return filtered;
  }, [tasks, selectedProjectId, searchQuery, selectedTags, selectedTypes]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      "in-progress": [],
      review: [],
      done: [],
    };

    filteredTasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    // Sort by updatedAt descending within each column
    Object.keys(grouped).forEach((status) => {
      grouped[status as TaskStatus].sort((a, b) => b.updatedAt - a.updatedAt);
    });

    return grouped;
  }, [filteredTasks]);

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleToggleType = (type: TaskType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setSelectedTypes([]);
    if (onProjectChange) {
      onProjectChange(null);
    }
  };

  const hasActiveFilters =
    searchQuery.trim() ||
    selectedTags.length > 0 ||
    selectedTypes.length > 0 ||
    selectedProjectId !== null;

  const taskTypes: TaskType[] = ["build", "think", "write", "explore", "fix"];

  return (
    <div className="flex flex-col h-full w-full">
      {/* Filters Bar */}
      <div className="mb-4 space-y-3 w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Project Filter */}
          {projects.length > 0 && onProjectChange && (
            <Select
              value={selectedProjectId || "all"}
              onValueChange={(value) => onProjectChange(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-full sm:w-[180px] md:w-[200px] text-sm">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {taskTypes.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={selectedTypes.includes(type)}
                  onCheckedChange={() => handleToggleType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}

              {allTags.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Tag</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allTags.map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={() => handleToggleTag(tag)}
                    >
                      {tag}
                    </DropdownMenuCheckboxItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="whitespace-nowrap">
              <X className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {(selectedTags.length > 0 || selectedTypes.length > 0 || selectedProjectId) && (
          <div className="flex flex-wrap gap-2">
            {selectedProjectId && (
              <Badge variant="secondary" className="gap-1">
                Project: {projects.find((p) => p.id === selectedProjectId)?.name || "Unknown"}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => onProjectChange?.(null)}
                />
              </Badge>
            )}
            {selectedTypes.map((type) => (
              <Badge key={type} variant="secondary" className="gap-1">
                {type}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => handleToggleType(type)}
                />
              </Badge>
            ))}
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => handleToggleTag(tag)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 sm:gap-4 h-full pb-4 min-w-max">
          {columns.map((column) => (
            <TaskColumn
              key={column.status}
              status={column.status}
              title={column.title}
              tasks={tasksByStatus[column.status]}
              onTaskClick={onTaskClick}
              onDrop={onMoveTask}
              onCreateTask={onCreateTask}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

