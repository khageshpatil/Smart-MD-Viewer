/**
 * Custom hook for GitHub integration
 * Handles authentication, PR fetching, and status synchronization
 */

import { useState, useEffect, useCallback } from "react";
import {
  GitHubUser,
  GitHubRepo,
  isAuthenticated,
  getStoredUser,
  authenticateWithPAT,
  clearAuth,
  fetchRepositories,
  fetchPullRequests,
  fetchPullRequest,
  parsePRUrl,
} from "@/lib/github";
import { GitHubPR, TicketStatus } from "@/lib/indexedDB";

export interface UseGitHubReturn {
  authenticated: boolean;
  user: GitHubUser | null;
  loading: boolean;
  error: string | null;
  authenticateWithToken: (token: string) => Promise<void>;
  logout: () => void;
  fetchRepos: () => Promise<GitHubRepo[]>;
  fetchPRs: (owner: string, repo: string) => Promise<GitHubPR[]>;
  getPRDetails: (url: string) => Promise<GitHubPR | null>;
  mapPRStatusToTicketStatus: (prStatus: GitHubPR["status"]) => TicketStatus;
}

export const useGitHub = (): UseGitHubReturn => {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = isAuthenticated();
      setAuthenticated(isAuth);
      if (isAuth) {
        setUser(getStoredUser());
      }
    };
    checkAuth();
  }, []);

  // Authenticate with Personal Access Token
  const authenticateWithToken = useCallback(async (token: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authenticateWithPAT(token);
      setUser(userData);
      setAuthenticated(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Authentication failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    clearAuth();
    setAuthenticated(false);
    setUser(null);
    setError(null);
  }, []);

  // Fetch repositories
  const fetchRepos = useCallback(async (): Promise<GitHubRepo[]> => {
    try {
      setLoading(true);
      setError(null);
      const repos = await fetchRepositories();
      return repos;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch repositories";
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch pull requests for a repository
  const fetchPRs = useCallback(async (owner: string, repo: string): Promise<GitHubPR[]> => {
    try {
      setLoading(true);
      setError(null);
      const prs = await fetchPullRequests(owner, repo);
      return prs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch pull requests";
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get PR details from URL
  const getPRDetails = useCallback(async (url: string): Promise<GitHubPR | null> => {
    try {
      const parsed = parsePRUrl(url);
      if (!parsed) {
        throw new Error("Invalid GitHub PR URL");
      }

      setLoading(true);
      setError(null);
      const pr = await fetchPullRequest(parsed.owner, parsed.repo, parsed.number);
      return pr;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch PR details";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Map PR status to ticket status
  const mapPRStatusToTicketStatus = useCallback((prStatus: GitHubPR["status"]): TicketStatus => {
    switch (prStatus) {
      case "open":
        return "in-review";
      case "merged":
        return "done";
      case "closed":
        return "todo"; // Closed without merge - back to todo
      default:
        return "in-progress";
    }
  }, []);

  return {
    authenticated,
    user,
    loading,
    error,
    authenticateWithToken,
    logout,
    fetchRepos,
    fetchPRs,
    getPRDetails,
    mapPRStatusToTicketStatus,
  };
};
