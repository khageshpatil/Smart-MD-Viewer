/**
 * GitHubConnect Component
 * Handles GitHub authentication UI
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Github, LogOut, ExternalLink } from "lucide-react";
import { GitHubUser } from "@/lib/github";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GitHubConnectProps {
  authenticated: boolean;
  user: GitHubUser | null;
  loading: boolean;
  onAuthenticate: (token: string) => Promise<void>;
  onLogout: () => void;
}

export const GitHubConnect = ({
  authenticated,
  user,
  loading,
  onAuthenticate,
  onLogout,
}: GitHubConnectProps) => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);

  const handleAuthenticate = async () => {
    if (!token.trim()) {
      setError("Please enter a valid token");
      return;
    }

    setAuthenticating(true);
    setError(null);

    try {
      await onAuthenticate(token.trim());
      setToken("");
      setShowAuthDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setAuthenticating(false);
    }
  };

  if (authenticated && user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub Connected
          </CardTitle>
          <CardDescription>You're connected to GitHub</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={user.avatar_url} alt={user.name} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">@{user.login}</p>
              </div>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub Integration
          </CardTitle>
          <CardDescription>
            Connect to GitHub to link pull requests with tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowAuthDialog(true)} disabled={loading}>
            <Github className="w-4 h-4 mr-2" />
            Connect GitHub
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect to GitHub</DialogTitle>
            <DialogDescription>
              Enter your GitHub Personal Access Token to connect
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertDescription className="text-sm">
                <p className="font-medium mb-2">To create a Personal Access Token:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
                  <li>Click "Generate new token (classic)"</li>
                  <li>Give it a name and select the "repo" scope</li>
                  <li>Copy the token and paste it below</li>
                </ol>
                <a
                  href="https://github.com/settings/tokens/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-xs flex items-center gap-1 mt-2"
                >
                  Create token on GitHub
                  <ExternalLink className="w-3 h-3" />
                </a>
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="token">Personal Access Token</Label>
              <Input
                id="token"
                type="password"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAuthenticate();
                  }
                }}
                placeholder="ghp_xxxxxxxxxxxx"
                className="mt-1"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAuthDialog(false);
                setToken("");
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAuthenticate} disabled={authenticating || !token.trim()}>
              {authenticating ? "Connecting..." : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
