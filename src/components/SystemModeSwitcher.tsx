/**
 * SystemModeSwitcher Component
 * Global mode switcher for CORTEX system modes
 * Represents equal sibling modes, not hierarchical navigation
 */

import { Link, useLocation } from "react-router-dom";
import { CheckSquare, FolderKanban, FileText, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

type SystemMode = "focus" | "projects" | "documents" | "tasks";

interface ModeConfig {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MODES: Record<SystemMode, ModeConfig> = {
  focus: {
    path: "/",
    label: "Focus",
    icon: CheckSquare,
  },
  projects: {
    path: "/projects",
    label: "Projects",
    icon: FolderKanban,
  },
  documents: {
    path: "/documents",
    label: "Documents",
    icon: FileText,
  },
  tasks: {
    path: "/tasks",
    label: "Tasks",
    icon: ListTodo,
  },
};

interface SystemModeSwitcherProps {
  className?: string;
}

export const SystemModeSwitcher = ({ className }: SystemModeSwitcherProps) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Determine active mode based on current path
  const getActiveMode = (): SystemMode => {
    if (currentPath === "/" || currentPath.startsWith("/focus")) return "focus";
    if (currentPath.startsWith("/projects")) return "projects";
    if (currentPath.startsWith("/documents")) return "documents";
    if (currentPath.startsWith("/tasks")) return "tasks";
    if (currentPath.startsWith("/tickets")) return "tasks"; // Tickets is part of tasks mode
    return "focus"; // default
  };

  const activeMode = getActiveMode();

  return (
    <div className={cn("flex items-center gap-0.5 sm:gap-1", className)}>
      {Object.entries(MODES).map(([mode, config]) => {
        const Icon = config.icon;
        const isActive = activeMode === mode;

        return (
          <Link
            key={mode}
            to={config.path}
            className={cn(
              "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground/70 hover:text-foreground hover:bg-accent/50"
            )}
            title={config.label}
          >
            <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "" : "opacity-60")} />
            <span className="hidden sm:inline">{config.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

