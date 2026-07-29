/**
 * ProjectSelector Component
 * Dropdown for selecting active project in Focus View
 */

import { Project } from "@/lib/indexedDB";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban } from "lucide-react";
import { Link } from "react-router-dom";

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string | null;
  onProjectChange: (projectId: string | null) => void;
  onCreateProject?: () => void;
}

export const ProjectSelector = ({
  projects,
  selectedProjectId,
  onProjectChange,
  onCreateProject,
}: ProjectSelectorProps) => {
  const activeProjects = projects.filter((p) => p.status === "active");
  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 sm:flex-initial">
      <Select
        value={selectedProjectId || "none"}
        onValueChange={(value) => onProjectChange(value === "none" ? null : value)}
      >
        <SelectTrigger className="w-full sm:w-[280px] md:w-[300px] font-medium text-sm">
          <SelectValue placeholder="Choose a project..." />
        </SelectTrigger>
        <SelectContent>
          {activeProjects.length > 0 ? (
            <>
              {activeProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <span>{project.name}</span>
                    <Badge variant="outline" className="text-xs">
                      Active
                    </Badge>
                  </div>
                </SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Other Projects
              </div>
              {projects
                .filter((p) => p.status !== "active")
                .map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
            </>
          ) : (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              No projects available
            </div>
          )}
          <div className="px-2 py-1.5">
            <SelectItem value="none">No Project Selected</SelectItem>
          </div>
        </SelectContent>
      </Select>
      {onCreateProject && (
        <Button variant="outline" size="sm" onClick={onCreateProject} className="flex-shrink-0">
          <Plus className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

