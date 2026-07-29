/**
 * TaskCard Component
 * Individual task card with drag support and basic info display
 */

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Task } from "@/lib/indexedDB";
import { GripVertical, Calendar, GitPullRequest, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskTypeBadge } from "./TaskTypeBadge";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  draggable?: boolean;
}

export const TaskCard = ({
  task,
  onClick,
  onDragStart,
  onDragEnd,
  draggable = true,
}: TaskCardProps) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("taskId", task.id);
    onDragStart?.(e);
  };

  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all hover:shadow-md border-l-4",
        "border-l-blue-500" // Default border color, can be customized per type
      )}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        {draggable && (
          <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 cursor-grab active:cursor-grabbing mt-1" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm line-clamp-2">{task.title}</h3>
            <TaskTypeBadge type={task.type} variant="outline" className="flex-shrink-0 text-xs" />
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {task.description.substring(0, 100)}
              {task.description.length > 100 ? "..." : ""}
            </p>
          )}

          <div className="flex flex-wrap gap-1 mb-3">
            {task.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {task.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{task.tags.length - 3}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {task.linkedDocumentIds.length > 0 && (
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span>{task.linkedDocumentIds.length}</span>
                </div>
              )}
              {task.linkedPRs.length > 0 && (
                <div className="flex items-center gap-1">
                  <GitPullRequest className="w-3 h-3" />
                  <span>{task.linkedPRs.length}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

