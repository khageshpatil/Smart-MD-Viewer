/**
 * GitHubPRPanel Component
 * Panel for browsing and linking GitHub PRs to tickets
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GitPullRequest, ExternalLink, RefreshCw, Search, Link as LinkIcon } from "lucide-react";
import { GitHubPR } from "@/lib/indexedDB";
import { GitHubRepo } from "@/lib/github";
import { Skeleton } from "@/components/ui/skeleton";

interface GitHubPRPanelProps {
  onFetchRepos: () => Promise<GitHubRepo[]>;
  onFetchPRs: (owner: string, repo: string) => Promise<GitHubPR[]>;
  onLinkPR: (prUrl: string) => void;
}

const PRStatusBadge = ({ status }: { status: GitHubPR["status"] }) => {
  const variants: Record<GitHubPR["status"], { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    open: { variant: "default", label: "Open" },
    merged: { variant: "secondary", label: "Merged" },
    closed: { variant: "destructive", label: "Closed" },
  };

  const config = variants[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const GitHubPRPanel = ({
  onFetchRepos,
  onFetchPRs,
  onLinkPR,
}: GitHubPRPanelProps) => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [prs, setPRs] = useState<GitHubPR[]>([]);
  const [filteredPRs, setFilteredPRs] = useState<GitHubPR[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed" | "merged">("all");

  // Load repositories on mount
  useEffect(() => {
    loadRepos();
  }, []);

  // Filter PRs based on search and status
  useEffect(() => {
    let filtered = prs;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (pr) =>
          pr.title.toLowerCase().includes(query) ||
          pr.author.toLowerCase().includes(query) ||
          pr.branch.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((pr) => pr.status === statusFilter);
    }

    setFilteredPRs(filtered);
  }, [prs, searchQuery, statusFilter]);

  const loadRepos = async () => {
    setLoading(true);
    try {
      const repoList = await onFetchRepos();
      setRepos(repoList);
    } catch (error) {
      console.error("Failed to load repositories:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPRs = async () => {
    if (!selectedRepo) return;

    setLoading(true);
    try {
      const prList = await onFetchPRs(selectedRepo.owner.login, selectedRepo.name);
      setPRs(prList);
    } catch (error) {
      console.error("Failed to load PRs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRepoSelect = (repoFullName: string) => {
    const repo = repos.find((r) => r.full_name === repoFullName);
    setSelectedRepo(repo || null);
    setPRs([]);
    setFilteredPRs([]);
    setSearchQuery("");
    setStatusFilter("all");
  };

  useEffect(() => {
    if (selectedRepo) {
      loadPRs();
    }
  }, [selectedRepo]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitPullRequest className="w-5 h-5" />
          GitHub Pull Requests
        </CardTitle>
        <CardDescription>Browse and link PRs to this ticket</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Repository Selection */}
        <div>
          <Label>Repository</Label>
          <div className="flex gap-2 mt-1">
            <Select
              value={selectedRepo?.full_name || ""}
              onValueChange={handleRepoSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select repository..." />
              </SelectTrigger>
              <SelectContent>
                {repos.map((repo) => (
                  <SelectItem key={repo.id} value={repo.full_name}>
                    {repo.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={loadRepos}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {selectedRepo && (
          <>
            {/* Filters */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search PRs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as any)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="merged">Merged</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* PR List */}
            <ScrollArea className="h-[400px] border rounded-md p-2">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredPRs.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {prs.length === 0 ? "No pull requests found" : "No matching PRs"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPRs.map((pr) => (
                    <Card key={pr.id} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">#{pr.number}</span>
                            <PRStatusBadge status={pr.status} />
                          </div>
                          <h4 className="text-sm font-medium mb-1 line-clamp-1">
                            {pr.title}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{pr.author}</span>
                            <span>→</span>
                            <span className="truncate">{pr.branch}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onLinkPR(pr.url)}
                          >
                            <LinkIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a
                              href={pr.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
};
