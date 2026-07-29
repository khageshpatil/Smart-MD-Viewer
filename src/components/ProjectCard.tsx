/**
 * ProjectCard Component
 * Display card for a project
 */

import { Project } from "@/lib/indexedDB";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash2, Play } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onSetActive?: (id: string) => void;
  taskCount?: number;
  documentCount?: number;
}

export const ProjectCard = ({
  project,
  onEdit,
  onDelete,
  onSetActive,
  taskCount = 0,
  documentCount = 0,
}: ProjectCardProps) => {
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

  // Truncate description for preview
  const descriptionPreview = project.description
    ? project.description.length > 100
      ? project.description.substring(0, 100) + "..."
      : project.description
    : "No description";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg mb-1">{project.name}</CardTitle>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={statusColors[project.status]}>
                {statusLabels[project.status]}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onSetActive && project.status !== "active" && (
                <DropdownMenuItem onClick={() => onSetActive(project.id)}>
                  <Play className="h-4 w-4 mr-2" />
                  Set Active
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(project.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4 line-clamp-3 text-sm">{descriptionPreview}</CardDescription>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-3 sm:gap-4">
            <span>{taskCount} task{taskCount !== 1 ? "s" : ""}</span>
            <span>{documentCount} doc{documentCount !== 1 ? "s" : ""}</span>
          </div>
          <span className="whitespace-nowrap">Updated {formatDistanceToNow(project.updatedAt, { addSuffix: true })}</span>
        </div>
      </CardContent>
    </Card>
  );
};

