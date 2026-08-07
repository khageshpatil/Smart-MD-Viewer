import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Document } from "@/lib/indexedDB";
import { SharedDocumentPayload, EncryptedShareEnvelope } from "@/lib/secureShare";
import { Lock, Download, Upload, Key } from "lucide-react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeDocument: Document | null;
  sharePassphrase: string;
  setSharePassphrase: (pass: string) => void;
  importPassphrase: string;
  setImportPassphrase: (pass: string) => void;
  pendingImportEnvelope: EncryptedShareEnvelope | null;
  importPreview: SharedDocumentPayload | null;
  handleCopySecureLink: () => void;
  handleDownloadEncryptedShareFile: () => void;
  handleImportEncryptedShareFile: () => void;
  handlePreviewImportedShare: () => void;
  handleSaveImportedDocument: () => void;
  clearImportState: () => void;
  previewMaxChars?: number;
}

export function ShareDialog({
  open,
  onOpenChange,
  activeDocument,
  sharePassphrase,
  setSharePassphrase,
  importPassphrase,
  setImportPassphrase,
  pendingImportEnvelope,
  importPreview,
  handleCopySecureLink,
  handleDownloadEncryptedShareFile,
  handleImportEncryptedShareFile,
  handlePreviewImportedShare,
  handleSaveImportedDocument,
  clearImportState,
  previewMaxChars = 260,
}: ShareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Secure Encrypted Sharing
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="export" className="gap-2">
              <Download className="w-4 h-4" />
              Create Share
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <Upload className="w-4 h-4" />
              Import Share
            </TabsTrigger>
          </TabsList>

          {/* Export & Share Tab */}
          <TabsContent value="export" className="space-y-4 pt-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Encryption Passphrase</label>
              <Input
                type="password"
                value={sharePassphrase}
                onChange={(e) => setSharePassphrase(e.target.value)}
                placeholder="Passphrase (min 8 characters)"
                className="bg-background border-input text-foreground font-mono"
              />
              {sharePassphrase.length > 0 && (
                <div className="space-y-1">
                  {(() => {
                    const len = sharePassphrase.length;
                    const hasNum = /\d/.test(sharePassphrase);
                    const hasSym = /[^a-zA-Z0-9]/.test(sharePassphrase);
                    const hasUpper = /[A-Z]/.test(sharePassphrase);
                    let score = 0;
                    if (len >= 8) score += 1;
                    if (len >= 12) score += 1;
                    if (hasNum) score += 1;
                    if (hasSym || hasUpper) score += 1;

                    const label =
                      len < 8
                        ? "Too short (min 8 chars)"
                        : score <= 1
                        ? "Weak"
                        : score === 2
                        ? "Fair"
                        : score === 3
                        ? "Strong"
                        : "Excellent";

                    const color =
                      len < 8
                        ? "bg-red-500 text-red-500"
                        : score <= 1
                        ? "bg-amber-500 text-amber-500"
                        : score === 2
                        ? "bg-yellow-500 text-yellow-600 dark:text-yellow-400"
                        : score === 3
                        ? "bg-emerald-500 text-emerald-500"
                        : "bg-blue-500 text-blue-500";

                    const width =
                      len < 8 ? "w-1/5" : score === 1 ? "w-2/5" : score === 2 ? "w-3/5" : score === 3 ? "w-4/5" : "w-full";

                    return (
                      <div className="space-y-1">
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${color.split(" ")[0]} ${width} transition-all duration-300`} />
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className={`font-medium ${color.split(" ").slice(1).join(" ")}`}>{label}</span>
                          <span className="text-muted-foreground">{len} characters</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                AES-GCM Web Crypto encryption runs 100% locally in your browser. Passphrase is required to decrypt.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={handleCopySecureLink} disabled={!activeDocument} className="w-full gap-2">
                <Lock className="w-4 h-4" />
                Copy Encrypted Share Link
              </Button>
              <Button variant="outline" onClick={handleDownloadEncryptedShareFile} disabled={!activeDocument} className="w-full gap-2">
                <Download className="w-4 h-4" />
                Download Encrypted File (.smdshare)
              </Button>
            </div>

            {!activeDocument && (
              <p className="text-xs text-amber-500 font-medium text-center">
                Please open a document first to create a secure share.
              </p>
            )}
          </TabsContent>

          {/* Import Share Tab */}
          <TabsContent value="import" className="space-y-4 pt-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">1. Select Encrypted File</label>
              <div>
                <Button variant="outline" onClick={handleImportEncryptedShareFile} className="w-full gap-2">
                  <Upload className="w-4 h-4" />
                  Choose .smdshare File
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">2. Decryption Passphrase</label>
              <Input
                type="password"
                value={importPassphrase}
                onChange={(e) => setImportPassphrase(e.target.value)}
                placeholder="Enter passphrase"
                className="bg-background border-input text-foreground"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={handlePreviewImportedShare} disabled={!pendingImportEnvelope} className="flex-1 gap-2">
                <Key className="w-4 h-4" />
                Decrypt & Preview
              </Button>
              {pendingImportEnvelope && (
                <Button variant="ghost" onClick={clearImportState}>
                  Clear
                </Button>
              )}
            </div>

            {importPreview && (
              <Card className="p-3 bg-muted/40 border-border space-y-1">
                <p className="font-medium truncate text-foreground">{importPreview.title || "Imported Document"}</p>
                <p className="text-xs text-muted-foreground">
                  {importPreview.content.length} characters • {importPreview.tags.length} tags
                </p>
                <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap pt-1 border-t border-border/50 mt-1">
                  {importPreview.content.slice(0, previewMaxChars)}
                </p>
              </Card>
            )}

            {importPreview && (
              <Button onClick={handleSaveImportedDocument} className="w-full">
                Save as Workspace Document
              </Button>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
