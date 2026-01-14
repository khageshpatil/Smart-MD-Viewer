/**
 * TicketBoard Component
 * Main Kanban board layout with all columns
 */

import { useState, useMemo } from "react";
import { Ticket, TicketStatus } from "@/lib/indexedDB";
import { TicketColumn } from "./TicketColumn";
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
import { TicketPriority } from "@/lib/indexedDB";

interface TicketBoardProps {
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
  onMoveTicket: (ticketId: string, newStatus: TicketStatus) => void;
  onCreateTicket: (status: TicketStatus) => void;
}

const columns: { status: TicketStatus; title: string }[] = [
  { status: "todo", title: "To Do" },
  { status: "in-progress", title: "In Progress" },
  { status: "in-review", title: "In Review" },
  { status: "done", title: "Done" },
];

export const TicketBoard = ({
  tickets,
  onTicketClick,
  onMoveTicket,
  onCreateTicket,
}: TicketBoardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<TicketPriority[]>([]);

  // Extract all unique tags from tickets
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tickets.forEach((ticket) => {
      ticket.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [tickets]);

  // Filter tickets based on search and filters
  const filteredTickets = useMemo(() => {
    let filtered = tickets;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(query) ||
          ticket.description.toLowerCase().includes(query) ||
          ticket.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          ticket.assignee?.toLowerCase().includes(query)
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((ticket) =>
        selectedTags.some((tag) => ticket.tags.includes(tag))
      );
    }

    // Priority filter
    if (selectedPriorities.length > 0) {
      filtered = filtered.filter((ticket) =>
        selectedPriorities.includes(ticket.priority)
      );
    }

    return filtered;
  }, [tickets, searchQuery, selectedTags, selectedPriorities]);

  // Group tickets by status
  const ticketsByStatus = useMemo(() => {
    const grouped: Record<TicketStatus, Ticket[]> = {
      todo: [],
      "in-progress": [],
      "in-review": [],
      done: [],
    };

    filteredTickets.forEach((ticket) => {
      grouped[ticket.status].push(ticket);
    });

    // Sort by updatedAt descending within each column
    Object.keys(grouped).forEach((status) => {
      grouped[status as TicketStatus].sort((a, b) => b.updatedAt - a.updatedAt);
    });

    return grouped;
  }, [filteredTickets]);

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleTogglePriority = (priority: TicketPriority) => {
    setSelectedPriorities((prev) =>
      prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setSelectedPriorities([]);
  };

  const hasActiveFilters =
    searchQuery.trim() || selectedTags.length > 0 || selectedPriorities.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Filters Bar */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(["low", "medium", "high"] as TicketPriority[]).map((priority) => (
                <DropdownMenuCheckboxItem
                  key={priority}
                  checked={selectedPriorities.includes(priority)}
                  onCheckedChange={() => handleTogglePriority(priority)}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
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
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {(selectedTags.length > 0 || selectedPriorities.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {selectedPriorities.map((priority) => (
              <Badge key={priority} variant="secondary" className="gap-1">
                {priority}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => handleTogglePriority(priority)}
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
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 h-full pb-4">
          {columns.map((column) => (
            <TicketColumn
              key={column.status}
              status={column.status}
              title={column.title}
              tickets={ticketsByStatus[column.status]}
              onTicketClick={onTicketClick}
              onDrop={onMoveTicket}
              onCreateTicket={onCreateTicket}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
