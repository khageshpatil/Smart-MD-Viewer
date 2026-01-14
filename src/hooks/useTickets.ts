/**
 * Custom hook for managing tickets
 * Provides CRUD operations and real-time state management
 */

import { useState, useEffect, useCallback } from "react";
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  getAllTickets,
  getTicket,
  createTicket as createTicketDB,
  updateTicket as updateTicketDB,
  deleteTicket as deleteTicketDB,
  searchTickets as searchTicketsDB,
  getTicketsByStatus,
  getTicketsByPriority,
  getTicketsByTag,
} from "@/lib/indexedDB";

export interface UseTicketsReturn {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  createTicket: (ticket: Omit<Ticket, "id" | "createdAt" | "updatedAt">) => Promise<Ticket>;
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  getTicketById: (id: string) => Promise<Ticket | undefined>;
  searchTickets: (query: string) => Promise<Ticket[]>;
  filterByStatus: (status: TicketStatus) => Promise<Ticket[]>;
  filterByPriority: (priority: TicketPriority) => Promise<Ticket[]>;
  filterByTag: (tag: string) => Promise<Ticket[]>;
  refreshTickets: () => Promise<void>;
  moveTicket: (id: string, newStatus: TicketStatus) => Promise<void>;
}

export const useTickets = (): UseTicketsReturn => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load all tickets on mount
  const refreshTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allTickets = await getAllTickets();
      setTickets(allTickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTickets();
  }, [refreshTickets]);

  // Create a new ticket
  const createTicket = useCallback(
    async (ticketData: Omit<Ticket, "id" | "createdAt" | "updatedAt">): Promise<Ticket> => {
      try {
        const now = Date.now();
        const newTicket: Ticket = {
          ...ticketData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };

        await createTicketDB(newTicket);
        await refreshTickets();
        return newTicket;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to create ticket";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [refreshTickets]
  );

  // Update an existing ticket
  const updateTicket = useCallback(
    async (id: string, updates: Partial<Ticket>): Promise<void> => {
      try {
        const existingTicket = await getTicket(id);
        if (!existingTicket) {
          throw new Error("Ticket not found");
        }

        const updatedTicket: Ticket = {
          ...existingTicket,
          ...updates,
          id, // Ensure ID doesn't change
          updatedAt: Date.now(),
        };

        await updateTicketDB(updatedTicket);
        await refreshTickets();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update ticket";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [refreshTickets]
  );

  // Delete a ticket
  const deleteTicket = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteTicketDB(id);
        await refreshTickets();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete ticket";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [refreshTickets]
  );

  // Get ticket by ID
  const getTicketById = useCallback(async (id: string): Promise<Ticket | undefined> => {
    try {
      return await getTicket(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get ticket");
      return undefined;
    }
  }, []);

  // Search tickets
  const searchTickets = useCallback(async (query: string): Promise<Ticket[]> => {
    try {
      return await searchTicketsDB(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search tickets");
      return [];
    }
  }, []);

  // Filter by status
  const filterByStatus = useCallback(async (status: TicketStatus): Promise<Ticket[]> => {
    try {
      return await getTicketsByStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to filter tickets");
      return [];
    }
  }, []);

  // Filter by priority
  const filterByPriority = useCallback(async (priority: TicketPriority): Promise<Ticket[]> => {
    try {
      return await getTicketsByPriority(priority);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to filter tickets");
      return [];
    }
  }, []);

  // Filter by tag
  const filterByTag = useCallback(async (tag: string): Promise<Ticket[]> => {
    try {
      return await getTicketsByTag(tag);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to filter tickets");
      return [];
    }
  }, []);

  // Move ticket to different status
  const moveTicket = useCallback(
    async (id: string, newStatus: TicketStatus): Promise<void> => {
      await updateTicket(id, { status: newStatus });
    },
    [updateTicket]
  );

  return {
    tickets,
    loading,
    error,
    createTicket,
    updateTicket,
    deleteTicket,
    getTicketById,
    searchTickets,
    filterByStatus,
    filterByPriority,
    filterByTag,
    refreshTickets,
    moveTicket,
  };
};
