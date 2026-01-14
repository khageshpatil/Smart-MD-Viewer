/**
 * TicketColumn Component
 * Kanban column for a specific status with drag and drop support
 */

import { Ticket, TicketStatus } from "@/lib/indexedDB";
import { TicketCard } from "./TicketCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TicketColumnProps {
  status: TicketStatus;
  title: string;
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
  onDrop: (ticketId: string, newStatus: TicketStatus) => void;
  onCreateTicket: (status: TicketStatus) => void;
  colorClass?: string;
}

const statusColors: Record<TicketStatus, string> = {
  todo: "bg-slate-500",
  "in-progress": "bg-blue-500",
  "in-review": "bg-yellow-500",
  done: "bg-green-500",
};

export const TicketColumn = ({
  status,
  title,
  tickets,
  onTicketClick,
  onDrop,
  onCreateTicket,
  colorClass,
}: TicketColumnProps) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData("ticketId");
    if (ticketId) {
      onDrop(ticketId, status);
    }
  };

  return (
    <div className="flex flex-col h-full min-w-[300px] max-w-[350px]">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div
            className={cn("w-3 h-3 rounded-full", colorClass || statusColors[status])}
          />
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="secondary" className="text-xs">
            {tickets.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCreateTicket(status)}
          className="h-8 w-8 p-0"
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
            {tickets.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No tickets
              </div>
            ) : (
              tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => onTicketClick(ticket)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};
