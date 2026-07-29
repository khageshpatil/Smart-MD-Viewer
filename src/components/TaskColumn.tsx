/**
 * TaskColumn Component
 * Kanban column for a specific status with drag and drop support
 */

import { Task, TaskStatus } from "@/lib/indexedDB";
import { TaskCard } from "./TaskCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDrop: (taskId: string, newStatus: TaskStatus) => void;
  onCreateTask: (status: TaskStatus) => void;
  colorClass?: string;
}

const statusColors: Record<TaskStatus, string> = {
  todo: "bg-slate-500",
  "in-progress": "bg-blue-500",
  review: "bg-yellow-500",
  done: "bg-green-500",
};

export const TaskColumn = ({
  status,
  title,
  tasks,
  onTaskClick,
  onDrop,
  onCreateTask,
  colorClass,
}: TaskColumnProps) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      onDrop(taskId, status);
    }
  };

  return (
    <div className="flex flex-col h-full w-[280px] sm:w-full sm:min-w-[300px] sm:max-w-[350px] flex-shrink-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn("w-3 h-3 rounded-full flex-shrink-0", colorClass || statusColors[status])}
          />
          <h3 className="font-semibold text-sm truncate">{title}</h3>
          <Badge variant="secondary" className="text-xs flex-shrink-0">
            {tasks.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCreateTask(status)}
          className="h-8 w-8 p-0 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <Card
        className={cn(
          "flex-1 p-3 bg-muted/30 border-dashed transition-colors",
          "hover:bg-muted/50"
        )}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <ScrollArea className="h-full pr-3">
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No tasks
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};

