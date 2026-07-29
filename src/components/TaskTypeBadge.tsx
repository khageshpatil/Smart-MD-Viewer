/**
 * TaskTypeBadge Component
 * Visual indicator for task types
 */

import { Badge } from "@/components/ui/badge";
import { TaskType } from "@/lib/indexedDB";
import { cn } from "@/lib/utils";

interface TaskTypeBadgeProps {
  type: TaskType;
  variant?: "default" | "secondary" | "outline";
  className?: string;
}

const typeColors: Record<TaskType, string> = {
  build: "bg-blue-500",
  think: "bg-purple-500",
  write: "bg-green-500",
  explore: "bg-orange-500",
  fix: "bg-red-500",
};

const typeLabels: Record<TaskType, string> = {
  build: "Build",
  think: "Think",
  write: "Write",
  explore: "Explore",
  fix: "Fix",
};

const typeIcons: Record<TaskType, string> = {
  build: "🔨",
  think: "💭",
  write: "✍️",
  explore: "🔍",
  fix: "🔧",
};

export const TaskTypeBadge = ({ type, variant = "default", className }: TaskTypeBadgeProps) => {
  return (
    <Badge
      variant={variant}
      className={cn(
        variant === "default" && "border-l-4",
        variant === "default" && typeColors[type],
        className
      )}
    >
      <span className="mr-1">{typeIcons[type]}</span>
      {typeLabels[type]}
    </Badge>
  );
};

