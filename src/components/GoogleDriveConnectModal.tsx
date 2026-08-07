import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, LogOut, Key, RefreshCw, Settings2, FolderArchive, ExternalLink } from "lucide-react";
import { GoogleUser, requestGoogleAuth, clearGoogleUser, getStoredClientId, setStoredClientId, exportWorkspaceToGoogleDrive } from "@/services/googleDrive";

interface GoogleDriveConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: GoogleUser | null;
  onUserChange: (user: GoogleUser | null) => void;
}

export function GoogleDriveConnectModal({
  open,
  onOpenChange,
  currentUser,
  onUserChange,
}: GoogleDriveConnectModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [clientIdInput, setClientIdInput] = useState(getStoredClientId());
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  const [isExportingWorkspace, setIsExportingWorkspace] = useState(false);
  const [exportProgressMsg, setExportProgressMsg] = useState("");
  const [exportResultUrl, setExportResultUrl] = useState<string | null>(null);

  const handleExportWorkspaceDrive = async () => {
    if (!currentUser) return;
    setIsExportingWorkspace(true);
    setErrorMsg(null);
    try {
      const res = await exportWorkspaceToGoogleDrive(currentUser.accessToken, (progress) => {
        setExportProgressMsg(`Uploading ${progress.current}/${progress.total}: "${progress.currentItem}"`);
      });
      setExportResultUrl(res.folderUrl);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to export workspace to Google Drive");
    } finally {
      setIsExportingWorkspace(false);
    }
  };


  const handleConnect = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (clientIdInput.trim()) {
        setStoredClientId(clientIdInput.trim());
      }
      const user = await requestGoogleAuth(clientIdInput.trim() || undefined);
      onUserChange(user);
      onOpenChange(false);
    } catch (err: any) {
      if (err?.message === "CLIENT_ID_MISSING") {
        setErrorMsg("App owner setup needed: Please configure VITE_GOOGLE_CLIENT_ID in .env or enter a Client ID below.");
        setShowAdvancedSettings(true);
      } else if (err?.message !== "popup_closed_by_user") {
        setErrorMsg(err?.message || "Failed to authenticate with Google");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    clearGoogleUser();
    onUserChange(null);
    onOpenChange(false);
  };

  const handleSaveClientId = () => {
    setStoredClientId(clientIdInput.trim());
    setShowAdvancedSettings(false);
    setErrorMsg(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <span className="text-xl">☁️</span>
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Google Drive Integration</DialogTitle>
              <DialogDescription className="text-xs">
                Export directly to native Google Docs and store files in Google Drive.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Connected State */}
        {currentUser ? (
          <div className="py-3 space-y-4">
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center gap-3">
              {currentUser.picture ? (
                <img
                  src={currentUser.picture}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full border border-emerald-500/30"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 font-bold flex items-center justify-center">
                  {currentUser.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm truncate">{currentUser.name}</p>
                  <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/40 px-1.5 py-0">
                    Connected
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
              </div>
            </div>

            {/* Workspace Export Card */}
            <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <FolderArchive className="w-4 h-4 text-primary" />
                    Export Full Workspace to Drive
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Uploads all your local documents & folder hierarchy into a dedicated folder on Google Drive.
                  </p>
                </div>
              </div>

              {exportResultUrl ? (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" /> Workspace Exported!
                  </span>
                  <a
                    href={exportResultUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    Open Drive Folder ↗
                  </a>
                </div>
              ) : (
                <Button
                  onClick={handleExportWorkspaceDrive}
                  disabled={isExportingWorkspace}
                  className="w-full gap-2 h-9 text-xs font-semibold"
                >
                  {isExportingWorkspace ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      {exportProgressMsg || "Exporting Workspace..."}
                    </>
                  ) : (
                    <>
                      <span className="text-sm">📁</span>
                      Export Whole Workspace to Drive
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Privacy & Security Guarantee</span>
              </div>
              <p className="leading-relaxed">
                Smart MD uses the restricted <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded text-foreground">drive.file</code> scope. It can <strong>only</strong> access Google Drive files created by Smart MD Viewer. Your private Google Drive contents remain untouched.
              </p>
            </div>
          </div>
        ) : (
          /* Disconnected State for End Users */
          <div className="py-3 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-muted/20 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-2xl">
                📄
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">One-Click Google Docs Export</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Connect your Google account to convert Markdown directly into native, formatted Google Docs.
                </p>
              </div>

              <Button
                onClick={handleConnect}
                disabled={loading}
                className="w-full gap-2 h-10 shadow-md shadow-primary/15 font-semibold text-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Connecting to Google...
                  </>
                ) : (
                  <>
                    <span className="text-lg">☁️</span>
                    Connect Google Account
                  </>
                )}
              </Button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs leading-relaxed">
                {errorMsg}
              </div>
            )}

            {/* Advanced Self-Hosters Option (Hidden by default) */}
            {showAdvancedSettings ? (
              <div className="p-3.5 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-primary" />
                    Self-Hosted OAuth Client ID
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] px-2"
                    onClick={() => setShowAdvancedSettings(false)}
                  >
                    Hide
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Only needed for custom self-hosted domains. Main site visitors do not need this.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="123456789-abc.apps.googleusercontent.com"
                    className="text-xs h-8 font-mono"
                  />
                  <Button size="sm" onClick={handleSaveClientId} className="h-8 text-xs shrink-0">
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center pt-1">
                <button
                  onClick={() => setShowAdvancedSettings(true)}
                  className="text-[11px] text-muted-foreground/70 hover:text-foreground inline-flex items-center gap-1 transition-colors"
                >
                  <Settings2 className="w-3 h-3" />
                  Self-hosting? Set custom Client ID
                </button>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="border-t border-border/50 pt-3 flex sm:justify-between items-center">
          {currentUser ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30 gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Disconnect
              </Button>
              <Button size="sm" onClick={() => onOpenChange(false)} className="text-xs">
                Done
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs ml-auto">
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
