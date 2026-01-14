/**
 * TicketCard Component
 * Individual ticket card with drag support and basic info display
 */

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, TicketPriority } from "@/lib/indexedDB";
import { GripVertical, Calendar, GitPullRequest, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketCardProps {
  ticket: Ticket;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  draggable?: boolean;
}

const priorityColors: Record<TicketPriority, string> = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
};

const priorityLabels: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const TicketCard = ({
  ticket,
  onClick,
  onDragStart,
  onDragEnd,
  draggable = true,
}: TicketCardProps) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("ticketId", ticket.id);
    onDragStart?.(e);
  };

  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all hover:shadow-md border-l-4",
        priorityColors[ticket.priority]
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
            <h3 className="font-semibold text-sm line-clamp-2">{ticket.title}</h3>
            <Badge variant="outline" className="flex-shrink-0 text-xs">
              {priorityLabels[ticket.priority]}
            </Badge>
          </div>

          {ticket.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {ticket.description.substring(0, 100)}
              {ticket.description.length > 100 ? "..." : ""}
            </p>
          )}

          <div className="flex flex-wrap gap-1 mb-3">
            {ticket.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {ticket.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{ticket.tags.length - 3}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {ticket.assignee && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span className="truncate max-w-[80px]">{ticket.assignee}</span>
                </div>
              )}
              {ticket.linkedPRs.length > 0 && (
                <div className="flex items-center gap-1">
                  <GitPullRequest className="w-3 h-3" />
                  <span>{ticket.linkedPRs.length}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
