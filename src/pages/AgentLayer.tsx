import { useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  FolderOpen,
  FileText,
  Unplug,
  Radio,
  WifiOff,
  Loader2,
  ChevronRight,
  Clock,
  Zap,
  AlertCircle,
  Home,
  GitBranch,
  BookOpen,
  Brain,
  Inbox,
  HelpCircle,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAgentLayer, AgentFile } from "@/hooks/useAgentLayer";
import { AgentTimeline } from "@/components/agent/AgentTimeline";
import { AgentSkills } from "@/components/agent/AgentSkills";
import { AgentMemory } from "@/components/agent/AgentMemory";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

const MarkdownPreview = lazy(() =>
  import("@/components/MarkdownPreview").then((m) => ({ default: m.MarkdownPreview }))
);

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId = "files" | "timeline" | "skills" | "memory";

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(isoTs: string): string {
  const diff = Date.now() - new Date(isoTs).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({
  status,
  repoLabel,
  lastPollAt,
}: {
  status: string;
  repoLabel: string;
  lastPollAt: Date | null;
}) {
  if (status === "connected") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Live</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground font-mono text-xs truncate max-w-[160px]">
          {repoLabel}
        </span>
        {lastPollAt && (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground text-xs">
              {lastPollAt.toLocaleTimeString()}
            </span>
          </>
        )}
      </div>
    );
  }
  if (status === "connecting") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" /> Connecting…
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="w-3 h-3" /> Error — reconnect
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <WifiOff className="w-3 h-3" /> No repo connected
    </div>
  );
}

// ── Tab nav ───────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: "files", label: "Files", Icon: FileText },
  { id: "timeline", label: "Timeline", Icon: GitBranch },
  { id: "skills", label: "Skills", Icon: BookOpen },
  { id: "memory", label: "Memory", Icon: Brain },
];

function TabBar({
  active,
  onChange,
  activityCount,
}: {
  active: TabId;
  onChange: (t: TabId) => void;
  activityCount: number;
}) {
  return (
    <div className="flex border-b border-border bg-background/95 backdrop-blur flex-shrink-0">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors relative ${
            active === id
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
          {id === "timeline" && activityCount > 0 && (
            <span className="text-[9px] bg-emerald-500 text-white rounded-full px-1.5 py-0.5 font-semibold leading-none">
              {activityCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── File tree item ────────────────────────────────────────────────────────────

function FileItem({
  file,
  isActive,
  onClick,
}: {
  file: AgentFile;
  isActive: boolean;
  onClick: () => void;
}) {
  const hasAgentEdit = !!file.lastAgentEdit;
  const dirParts = file.path.split("/");
  const depth = dirParts.length - 1;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left py-2 rounded-lg transition-all duration-150 group flex items-start gap-2 ${
        isActive
          ? "bg-primary/10 text-primary border border-primary/20"
          : "hover:bg-muted/60 text-foreground border border-transparent"
      }`}
      style={{ paddingLeft: `${12 + depth * 12}px`, paddingRight: "8px" }}
    >
      <div className="relative flex-shrink-0 mt-0.5">
        <FileText
          className={`w-3.5 h-3.5 ${
            isActive
              ? "text-primary"
              : "text-muted-foreground group-hover:text-foreground"
          }`}
        />
        {hasAgentEdit && (
          <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-1 ring-background" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">{file.name}</div>
        {depth > 0 && (
          <div className="text-[10px] text-muted-foreground truncate">
            {dirParts.slice(0, -1).join("/")}
          </div>
        )}
        {hasAgentEdit && (
          <div className="flex items-center gap-1 mt-0.5">
            <Zap className="w-2.5 h-2.5 text-emerald-500" />
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
              {file.lastAgentTool} · {relativeTime(file.lastAgentEdit!)}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

// ── How to Use Guide Dialog ───────────────────────────────────────────────────

function AgentGuideDialog() {
  const [copiedMcp, setCopiedMcp] = useState(false);
  const mcpCmd = `claude mcp add smart-md -- node .claude/hooks/mcp.js`;

  const copyMcp = () => {
    navigator.clipboard.writeText(mcpCmd);
    setCopiedMcp(true);
    setTimeout(() => setCopiedMcp(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
          <HelpCircle className="w-3.5 h-3.5 text-violet-500" />
          <span>How to Use</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Radio className="w-5 h-5 text-violet-500" />
            Agent Layer — Setup & Usage Guide
          </DialogTitle>
          <DialogDescription>
            A local-first live window into every Markdown file your AI coding agent touches.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 text-sm pt-2">
          {/* ⚡ Quick Setup */}
          <div className="space-y-3">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              1. Quick Setup (3 Steps)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-muted/40 rounded-xl p-3 border border-border/50">
                <div className="font-bold text-xs text-primary mb-1">Step 1</div>
                <div className="font-medium text-xs mb-1">Copy Hook Scripts</div>
                <p className="text-[11px] text-muted-foreground">
                  Copy the <code className="bg-muted px-1 rounded text-foreground">.claude/</code> folder into your target repository root.
                </p>
              </div>

              <div className="bg-muted/40 rounded-xl p-3 border border-border/50">
                <div className="font-bold text-xs text-primary mb-1">Step 2</div>
                <div className="font-medium text-xs mb-1">Connect Folder</div>
                <p className="text-[11px] text-muted-foreground">
                  Click <strong>Connect Repo Folder</strong> above and grant read permission.
                </p>
              </div>

              <div className="bg-muted/40 rounded-xl p-3 border border-border/50">
                <div className="font-bold text-xs text-primary mb-1">Step 3</div>
                <div className="font-medium text-xs mb-1">Run Agent</div>
                <p className="text-[11px] text-muted-foreground">
                  Run Claude Code in terminal. Edits render live within 2 seconds!
                </p>
              </div>
            </div>

            {/* Visual File Tree Box */}
            <div className="bg-muted/60 rounded-xl p-3 border border-border/60 font-mono text-[11px] leading-relaxed text-muted-foreground overflow-x-auto">
              <div className="text-[10px] uppercase font-bold text-foreground/70 mb-1 tracking-wider">Required Target Repo Structure:</div>
              <pre className="text-foreground/90 font-mono">{`your-repository/
├── .claude/
│   ├── hooks/
│   │   ├── notify.js       # Logs agent edits to activity.log
│   │   ├── snapshot.js     # Saves pre-edit snapshots for diffs
│   │   └── mcp.js          # Pure Node stdio MCP Server
│   └── settings.json       # Wires PreToolUse & PostToolUse hooks
├── SKILL.md                # Agent skill files
└── README.md`}</pre>
            </div>
          </div>

          {/* 🛠️ The 4 Tabs */}
          <div className="space-y-3">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
              2. What Each Tab Does
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/40">
                <FileText className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-xs">Files Tab</div>
                  <p className="text-[11px] text-muted-foreground">
                    Live scan of all repo <code className="bg-muted px-1 rounded text-foreground">.md</code> files. Highlights files modified by your agent with glowing status rings & timestamps.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/40">
                <GitBranch className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-xs">Timeline Tab</div>
                  <p className="text-[11px] text-muted-foreground">
                    Full history of agent edits. View side-by-side rendered diffs (before snapshot vs current file) and revert any agent edit with one click.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/40">
                <BookOpen className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-xs">Skills Tab</div>
                  <p className="text-[11px] text-muted-foreground">
                    Lints all <code className="bg-muted px-1 rounded text-foreground">SKILL.md</code> files for broken relative links, description collisions, missing frontmatter, and estimates token usage.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/40">
                <Brain className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-xs">Memory Tab</div>
                  <p className="text-[11px] text-muted-foreground">
                    Human-in-the-loop memory gate. Review, edit, approve or reject observations proposed by the agent before saving them to curated memory.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 🔌 MCP Server */}
          <div className="space-y-3">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-violet-500" />
              3. MCP Server Integration (Optional)
            </h4>
            <div className="bg-muted/50 rounded-xl p-3 border border-border font-mono text-xs relative">
              <div className="flex items-center justify-between gap-2">
                <span className="text-foreground truncate">{mcpCmd}</span>
                <Button size="sm" variant="ghost" onClick={copyMcp} className="h-6 px-2 text-[10px]">
                  {copiedMcp ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {copiedMcp ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Registers 5 stdio tools (<code className="bg-muted px-1 rounded text-foreground">list_docs</code>, <code className="bg-muted px-1 rounded text-foreground">search_docs</code>, <code className="bg-muted px-1 rounded text-foreground">get_section</code>, <code className="bg-muted px-1 rounded text-foreground">validate_skills</code>, <code className="bg-muted px-1 rounded text-foreground">propose_memory</code>) so Claude Code can query your documentation without filling up context window tokens.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Disconnected empty state ──────────────────────────────────────────────────

function DisconnectedState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
        <Radio className="w-8 h-8 text-violet-500" />
      </div>
      <div>
        <h2 className="text-xl font-bold mb-2">Agent Layer</h2>
        <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
          A live window into every Markdown file your coding agent touches — rendered
          properly, diffed, searchable, and auditable.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={onConnect} className="gap-2">
          <FolderOpen className="w-4 h-4" />
          Connect Repo Folder
        </Button>
        <AgentGuideDialog />
      </div>
      <p className="text-xs text-muted-foreground">
        Chromium-only (Chrome, Edge, Arc, Brave) · Files stay on your machine
      </p>

      {/* Tabs preview */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-2">
        {[
          { icon: FileText, label: "Files", desc: "Full .md tree, live highlights" },
          { icon: GitBranch, label: "Timeline", desc: "Before/after diff per edit" },
          { icon: BookOpen, label: "Skills", desc: "Skill linter + token budget" },
          { icon: Brain, label: "Memory", desc: "Approve what the agent remembers" },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="bg-muted/40 rounded-xl p-3 text-left">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold">{label}</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug">{desc}</p>
          </div>
        ))}
      </div>

      <div className="w-full max-w-sm bg-muted/40 rounded-xl p-4 text-left">
        <div className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
          One-time hook setup
        </div>
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>
            <span className="font-mono text-primary font-bold">1.</span>{" "}
            Copy <code className="bg-muted rounded px-1">.claude/hooks/</code> and{" "}
            <code className="bg-muted rounded px-1">.claude/settings.json</code> into your repo
          </li>
          <li>
            <span className="font-mono text-primary font-bold">2.</span>{" "}
            Connect this repo folder above
          </li>
          <li>
            <span className="font-mono text-primary font-bold">3.</span>{" "}
            Run Claude Code — edits appear live
          </li>
        </ol>
      </div>
    </div>
  );
}

// ── Files tab ─────────────────────────────────────────────────────────────────

function FilesTab({
  files,
  activeFilePath,
  activeContent,
  activityLog,
  openFile,
  isScanning,
}: {
  files: AgentFile[];
  activeFilePath: string | null;
  activeContent: string;
  activityLog: any[];
  openFile: (path: string) => void;
  isScanning?: boolean;
}) {
  const [sidebarFilter, setSidebarFilter] = useState<"all" | "agent">("all");

  const visibleFiles =
    sidebarFilter === "agent" ? files.filter((f) => f.lastAgentEdit) : files;

  const sortedFiles = [...visibleFiles].sort((a, b) => {
    if (a.lastAgentEdit && b.lastAgentEdit)
      return b.lastAgentEdit.localeCompare(a.lastAgentEdit);
    if (a.lastAgentEdit) return -1;
    if (b.lastAgentEdit) return 1;
    return a.path.localeCompare(b.path);
  });

  const agentTouchedCount = files.filter((f) => f.lastAgentEdit).length;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-border flex flex-col overflow-hidden bg-muted/20">
        <div className="flex border-b border-border flex-shrink-0">
          <button
            onClick={() => setSidebarFilter("all")}
            className={`flex-1 text-xs py-2 font-medium transition-colors ${
              sidebarFilter === "all"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({files.length})
          </button>
          <button
            onClick={() => setSidebarFilter("agent")}
            className={`flex-1 text-xs py-2 font-medium transition-colors flex items-center justify-center gap-1 ${
              sidebarFilter === "agent"
                ? "text-foreground border-b-2 border-emerald-500"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="w-3 h-3 text-emerald-500" />
            Agent ({agentTouchedCount})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {isScanning ? (
            <div className="p-2 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                Scanning Markdown files...
              </div>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-9 bg-muted/40 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : sortedFiles.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-8">
              {sidebarFilter === "agent" ? "No agent edits yet" : "No .md files found"}
            </div>
          ) : (
            sortedFiles.map((file) => (
              <FileItem
                key={file.path}
                file={file}
                isActive={file.path === activeFilePath}
                onClick={() => openFile(file.path)}
              />
            ))
          )}
        </div>

        {activityLog.length > 0 && (
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {activityLog.length} events logged
            </div>
          </div>
        )}
      </aside>

      {/* Preview pane */}
      <main className="flex-1 overflow-auto">
        {activeFilePath && activeContent ? (
          <div className="h-full overflow-auto">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-2 flex items-center gap-1 text-xs text-muted-foreground">
              {activeFilePath.split("/").map((part, i, arr) => (
                <span key={i} className="flex items-center gap-1">
                  {i === arr.length - 1 ? (
                    <span className="text-foreground font-medium">{part}</span>
                  ) : (
                    <>
                      <span>{part}</span>
                      <ChevronRight className="w-3 h-3" />
                    </>
                  )}
                </span>
              ))}
              {files.find((f) => f.path === activeFilePath)?.lastAgentEdit && (
                <span className="ml-auto flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Zap className="w-3 h-3" />
                  Agent ·{" "}
                  {relativeTime(files.find((f) => f.path === activeFilePath)!.lastAgentEdit!)}
                </span>
              )}
            </div>
            <div className="px-6 py-6 max-w-4xl mx-auto">
              <Suspense
                fallback={
                  <div className="flex items-center gap-2 text-muted-foreground py-8">
                    <Loader2 className="w-4 h-4 animate-spin" /> Rendering…
                  </div>
                }
              >
                <MarkdownPreview content={activeContent} showFrontmatter={false} />
              </Suspense>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <FileText className="w-10 h-10 opacity-30" />
            <p className="text-sm">Select a file to preview</p>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AgentLayer() {
  const {
    status,
    repoLabel,
    files,
    activeFilePath,
    activeContent,
    activityLog,
    lastPollAt,
    isScanning,
    hasClaudeHooks,
    connect,
    disconnect,
    openFile,
    readSnapshotContent,
    readFileContent,
    writeFileContent,
    getRootHandle,
  } = useAgentLayer();

  const [activeTab, setActiveTab] = useState<TabId>("files");

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* ── Top header ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 h-12 border-b border-border flex-shrink-0 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Back to Smart MD"
          >
            <Home className="w-4 h-4" />
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <div className="flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-violet-500" />
            <span className="font-semibold text-sm">Agent Layer</span>
          </div>
        </div>

        <StatusBadge status={status} repoLabel={repoLabel} lastPollAt={lastPollAt} />

        <div className="flex items-center gap-2">
          <AgentGuideDialog />
          {status === "connected" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={disconnect}
              className="gap-1.5 text-muted-foreground hover:text-foreground text-xs"
            >
              <Unplug className="w-3.5 h-3.5" />
              Disconnect
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={connect}
              disabled={status === "connecting"}
              className="gap-1.5 text-xs"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Connect
            </Button>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Missing Hooks Alert Banner */}
      {status === "connected" && !hasClaudeHooks && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs flex items-center justify-between text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>.claude hooks missing:</strong> Copy the <code className="bg-amber-500/20 px-1 rounded text-foreground font-mono">.claude/</code> folder into your repository root so agent edits are logged live.
            </span>
          </div>
        </div>
      )}

      {/* ── Main body ───────────────────────────────────────────────────────── */}
      {status !== "connected" ? (
        <div className="flex-1 overflow-auto">
          <DisconnectedState onConnect={connect} />
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Tab bar */}
          <TabBar
            active={activeTab}
            onChange={setActiveTab}
            activityCount={activityLog.length}
          />

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "files" && (
              <FilesTab
                files={files}
                activeFilePath={activeFilePath}
                activeContent={activeContent}
                activityLog={activityLog}
                openFile={openFile}
                isScanning={isScanning}
              />
            )}
            {activeTab === "timeline" && (
              <AgentTimeline
                activityLog={activityLog}
                readSnapshotContent={readSnapshotContent}
                readFileContent={readFileContent}
                writeFileContent={writeFileContent}
              />
            )}
            {activeTab === "skills" && <AgentSkills getRootHandle={getRootHandle} />}
            {activeTab === "memory" && (
              <AgentMemory
                readFileContent={readFileContent}
                writeFileContent={writeFileContent}
                getRootHandle={getRootHandle}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
