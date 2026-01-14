/**
 * Tickets Page
 * Main page for the Jira-like ticket management system
 */

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Plus, Github, Menu, FileText } from "lucide-react";
import { TicketBoard } from "@/components/TicketBoard";
import { TicketModal } from "@/components/TicketModal";
import { GitHubConnect } from "@/components/GitHubConnect";
import { GitHubPRPanel } from "@/components/GitHubPRPanel";
import { useTickets } from "@/hooks/useTickets";
import { useGitHub } from "@/hooks/useGitHub";
import { Ticket, TicketStatus } from "@/lib/indexedDB";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";

const Tickets = () => {
  const { toast } = useToast();
  
  // Hooks
  const {
    tickets,
    loading: ticketsLoading,
    error: ticketsError,
    createTicket,
    updateTicket,
    deleteTicket,
    moveTicket,
    refreshTickets,
  } = useTickets();

  const {
    authenticated,
    user,
    loading: githubLoading,
    error: githubError,
    authenticateWithToken,
    logout,
    fetchRepos,
    fetchPRs,
    getPRDetails,
    mapPRStatusToTicketStatus,
  } = useGitHub();

  // State
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialStatus, setInitialStatus] = useState<TicketStatus | undefined>(undefined);
  const [githubPanelOpen, setGithubPanelOpen] = useState(false);

  // Show errors in toasts
  useEffect(() => {
    if (ticketsError) {
      toast({
        title: "Error",
        description: ticketsError,
        variant: "destructive",
      });
    }
  }, [ticketsError, toast]);

  useEffect(() => {
    if (githubError) {
      toast({
        title: "GitHub Error",
        description: githubError,
        variant: "destructive",
      });
    }
  }, [githubError, toast]);

  // Handle ticket click
  const handleTicketClick = useCallback((ticket: Ticket) => {
    setSelectedTicket(ticket);
    setInitialStatus(undefined);
    setModalOpen(true);
  }, []);

  // Handle create ticket
  const handleCreateTicket = useCallback((status: TicketStatus) => {
    setSelectedTicket(null);
    setInitialStatus(status);
    setModalOpen(true);
  }, []);

  // Handle save ticket
  const handleSaveTicket = useCallback(
    async (updates: Partial<Ticket>) => {
      try {
        if (selectedTicket) {
          // Update existing ticket
          await updateTicket(selectedTicket.id, updates);
          toast({
            title: "Success",
            description: "Ticket updated successfully",
          });
        } else {
          // Create new ticket
          await createTicket({
            title: updates.title || "",
            description: updates.description || "",
            status: updates.status || initialStatus || "todo",
            priority: updates.priority || "medium",
            tags: updates.tags || [],
            assignee: updates.assignee || null,
            linkedPRs: updates.linkedPRs || [],
          });
          toast({
            title: "Success",
            description: "Ticket created successfully",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to save ticket",
          variant: "destructive",
        });
      }
    },
    [selectedTicket, initialStatus, createTicket, updateTicket, toast]
  );

  // Handle delete ticket
  const handleDeleteTicket = useCallback(
    async (id: string) => {
      try {
        await deleteTicket(id);
        toast({
          title: "Success",
          description: "Ticket deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete ticket",
          variant: "destructive",
        });
      }
    },
    [deleteTicket, toast]
  );

  // Handle move ticket (drag and drop)
  const handleMoveTicket = useCallback(
    async (ticketId: string, newStatus: TicketStatus) => {
      try {
        await moveTicket(ticketId, newStatus);
        toast({
          title: "Success",
          description: "Ticket moved successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to move ticket",
          variant: "destructive",
        });
      }
    },
    [moveTicket, toast]
  );

  // Handle GitHub authentication
  const handleGitHubAuth = useCallback(
    async (token: string) => {
      await authenticateWithToken(token);
      toast({
        title: "Success",
        description: "Connected to GitHub successfully",
      });
    },
    [authenticateWithToken, toast]
  );

  // Handle GitHub logout
  const handleGitHubLogout = useCallback(() => {
    logout();
    toast({
      title: "Disconnected",
      description: "Disconnected from GitHub",
    });
  }, [logout, toast]);

  // Handle link PR (for use in PR panel)
  const handleLinkPR = useCallback(
    async (prUrl: string) => {
      if (selectedTicket) {
        const updatedPRs = [...selectedTicket.linkedPRs];
        if (!updatedPRs.includes(prUrl)) {
          updatedPRs.push(prUrl);
          try {
            await updateTicket(selectedTicket.id, { linkedPRs: updatedPRs });
            // Update local state to reflect the change immediately
            setSelectedTicket({ ...selectedTicket, linkedPRs: updatedPRs });
            toast({
              title: "Success",
              description: "PR linked to ticket",
            });
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to link PR",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Already Linked",
            description: "This PR is already linked to the ticket",
          });
        }
      }
    },
    [selectedTicket, updateTicket, toast]
  );

  // Sync PR status with ticket status
  const handleSyncPRStatus = useCallback(async () => {
    if (!authenticated) {
      toast({
        title: "Not Connected",
        description: "Please connect to GitHub first",
        variant: "destructive",
      });
      return;
    }

    try {
      let syncCount = 0;
      
      for (const ticket of tickets) {
        if (ticket.linkedPRs.length > 0) {
          // Check the first linked PR's status
          const prUrl = ticket.linkedPRs[0];
          const prDetails = await getPRDetails(prUrl);
          
          if (prDetails) {
            const newStatus = mapPRStatusToTicketStatus(prDetails.status);
            if (newStatus !== ticket.status) {
              await moveTicket(ticket.id, newStatus);
              syncCount++;
            }
          }
        }
      }

      if (syncCount > 0) {
        toast({
          title: "Sync Complete",
          description: `Updated ${syncCount} ticket(s) based on PR status`,
        });
        await refreshTickets();
      } else {
        toast({
          title: "Already in Sync",
          description: "All tickets are up to date",
        });
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync PR status",
        variant: "destructive",
      });
    }
  }, [
    authenticated,
    tickets,
    getPRDetails,
    mapPRStatusToTicketStatus,
    moveTicket,
    refreshTickets,
    toast,
  ]);

  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="border-b px-6 py-3 flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <FileText className="w-5 h-5" />
              <span className="text-sm text-muted-foreground">Back to Documents</span>
            </Link>
            <div className="w-px h-6 bg-border" />
            <h1 className="text-xl font-semibold">Ticket Board</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCreateTicket("todo")}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>

            <Sheet open={githubPanelOpen} onOpenChange={setGithubPanelOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle>GitHub Integration</SheetTitle>
                  <SheetDescription>
                    Connect to GitHub and manage pull requests
                  </SheetDescription>
                </SheetHeader>

                <Tabs defaultValue="connect">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="connect">Connection</TabsTrigger>
                    <TabsTrigger value="prs" disabled={!authenticated}>
                      Pull Requests
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="connect" className="space-y-4 mt-4">
                    <GitHubConnect
                      authenticated={authenticated}
                      user={user}
                      loading={githubLoading}
                      onAuthenticate={handleGitHubAuth}
                      onLogout={handleGitHubLogout}
                    />

                    {authenticated && (
                      <Button onClick={handleSyncPRStatus} className="w-full">
                        Sync PR Status with Tickets
                      </Button>
                    )}
                  </TabsContent>

                  <TabsContent value="prs" className="mt-4">
                    {authenticated ? (
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          Open a ticket to link pull requests directly from the ticket editor.
                        </div>
                        <GitHubPRPanel
                          onFetchRepos={fetchRepos}
                          onFetchPRs={fetchPRs}
                          onLinkPR={(prUrl) => {
                            toast({
                              title: "Info",
                              description: "Please open a ticket first to link PRs",
                            });
                          }}
                        />
                      </div>
                    ) : (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        Connect to GitHub first
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </SheetContent>
            </Sheet>

            <ThemeToggle />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden p-6">
          {ticketsLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading tickets...</p>
              </div>
            </div>
          ) : (
            <TicketBoard
              tickets={tickets}
              onTicketClick={handleTicketClick}
              onMoveTicket={handleMoveTicket}
              onCreateTicket={handleCreateTicket}
            />
          )}
        </main>

        {/* Ticket Modal */}
        <TicketModal
          ticket={selectedTicket}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedTicket(null);
            setInitialStatus(undefined);
          }}
          onSave={handleSaveTicket}
          onDelete={selectedTicket ? handleDeleteTicket : undefined}
          initialStatus={initialStatus}
          authenticated={authenticated}
          onFetchRepos={fetchRepos}
          onFetchPRs={fetchPRs}
          onLinkPR={handleLinkPR}
        />
      </div>
    </SidebarProvider>
  );
};

export default Tickets;
