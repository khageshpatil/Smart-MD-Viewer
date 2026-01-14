/**
 * GitHub Integration Service
 * Handles OAuth PKCE flow and GitHub API interactions
 */

import { GitHubPR } from "./indexedDB";

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || "";
const GITHUB_REDIRECT_URI = import.meta.env.VITE_GITHUB_REDIRECT_URI || `${window.location.origin}/github/callback`;

// Storage keys
const GITHUB_TOKEN_KEY = "github_access_token";
const GITHUB_USER_KEY = "github_user";

export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  email: string | null;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  description: string | null;
  private: boolean;
  html_url: string;
}

interface GitHubAPIPR {
  id: number;
  number: number;
  title: string;
  html_url: string;
  merged_at: string | null;
  state: "open" | "closed";
  user: {
    login: string;
  };
  head: {
    ref: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Generate random string for PKCE
 */
const generateRandomString = (length: number): string => {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values)
    .map((x) => possible[x % possible.length])
    .join("");
};

/**
 * Generate code challenge for PKCE
 */
const sha256 = async (plain: string): Promise<ArrayBuffer> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest("SHA-256", data);
};

const base64urlencode = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem(GITHUB_TOKEN_KEY);
};

/**
 * Get stored access token
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem(GITHUB_TOKEN_KEY);
};

/**
 * Get stored user info
 */
export const getStoredUser = (): GitHubUser | null => {
  const userJson = localStorage.getItem(GITHUB_USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
};

/**
 * Store access token and user info
 */
export const storeAuth = (token: string, user: GitHubUser): void => {
  localStorage.setItem(GITHUB_TOKEN_KEY, token);
  localStorage.setItem(GITHUB_USER_KEY, JSON.stringify(user));
};

/**
 * Clear authentication
 */
export const clearAuth = (): void => {
  localStorage.removeItem(GITHUB_TOKEN_KEY);
  localStorage.removeItem(GITHUB_USER_KEY);
};

/**
 * Initiate GitHub OAuth flow with PKCE
 * Note: For production, you'll need to register a GitHub OAuth app
 * and set VITE_GITHUB_CLIENT_ID in your .env file
 */
export const initiateGitHubAuth = async (): Promise<void> => {
  if (!GITHUB_CLIENT_ID) {
    throw new Error("GitHub Client ID not configured. Please set VITE_GITHUB_CLIENT_ID in your .env file.");
  }

  const codeVerifier = generateRandomString(128);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64urlencode(hashed);

  // Store code verifier for later use
  sessionStorage.setItem("code_verifier", codeVerifier);

  // Build authorization URL
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: "repo read:user user:email",
    response_type: "code",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
};

/**
 * Exchange authorization code for access token
 * Note: This requires a backend proxy as GitHub doesn't support PKCE directly
 * For demo purposes, we'll use a token directly from GitHub's device flow or PAT
 */
export const exchangeCodeForToken = async (code: string): Promise<string> => {
  // In a real implementation, you would call your backend here
  // Backend would exchange code for token using client_secret
  throw new Error("Token exchange requires a backend service. Use Personal Access Token (PAT) for now.");
};

/**
 * Authenticate with Personal Access Token (PAT)
 * For demo/development purposes
 */
export const authenticateWithPAT = async (token: string): Promise<GitHubUser> => {
  const user = await fetchGitHubUser(token);
  storeAuth(token, user);
  return user;
};

/**
 * Fetch current GitHub user
 */
export const fetchGitHubUser = async (token?: string): Promise<GitHubUser> => {
  const accessToken = token || getAccessToken();
  if (!accessToken) throw new Error("Not authenticated");

  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user information");
  }

  return response.json();
};

/**
 * Fetch user's repositories
 */
export const fetchRepositories = async (options?: {
  sort?: "created" | "updated" | "pushed" | "full_name";
  direction?: "asc" | "desc";
  per_page?: number;
  page?: number;
}): Promise<GitHubRepo[]> => {
  const token = getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const params = new URLSearchParams({
    sort: options?.sort || "updated",
    direction: options?.direction || "desc",
    per_page: String(options?.per_page || 30),
    page: String(options?.page || 1),
  });

  const response = await fetch(`https://api.github.com/user/repos?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch repositories");
  }

  return response.json();
};

/**
 * Fetch pull requests for a repository
 */
export const fetchPullRequests = async (
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "all"
): Promise<GitHubPR[]> => {
  const token = getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const params = new URLSearchParams({
    state,
    per_page: "100",
    sort: "updated",
    direction: "desc",
  });

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch pull requests");
  }

  const prs: GitHubAPIPR[] = await response.json();

  // Transform GitHub PR to our format
  return prs.map((pr) => ({
    id: String(pr.id),
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
    status: pr.merged_at ? "merged" : pr.state,
    author: pr.user.login,
    branch: pr.head.ref,
    repoFullName: `${owner}/${repo}`,
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    mergedAt: pr.merged_at,
  }));
};

/**
 * Fetch a single pull request by number
 */
export const fetchPullRequest = async (
  owner: string,
  repo: string,
  prNumber: number
): Promise<GitHubPR> => {
  const token = getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch pull request");
  }

  const pr = await response.json();

  return {
    id: String(pr.id),
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
    status: pr.merged_at ? "merged" : pr.state,
    author: pr.user.login,
    branch: pr.head.ref,
    repoFullName: `${owner}/${repo}`,
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    mergedAt: pr.merged_at,
  };
};

/**
 * Search repositories (public)
 */
export const searchRepositories = async (query: string): Promise<GitHubRepo[]> => {
  const token = getAccessToken();
  
  const params = new URLSearchParams({
    q: query,
    per_page: "30",
    sort: "stars",
  });

  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `https://api.github.com/search/repositories?${params.toString()}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error("Failed to search repositories");
  }

  const data = await response.json();
  return data.items;
};

/**
 * Parse GitHub PR URL to extract owner, repo, and PR number
 */
export const parsePRUrl = (url: string): { owner: string; repo: string; number: number } | null => {
  const regex = /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/;
  const match = url.match(regex);
  
  if (!match) return null;
  
  return {
    owner: match[1],
    repo: match[2],
    number: parseInt(match[3], 10),
  };
};
