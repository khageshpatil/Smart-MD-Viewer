// src/components/agent/AgentTimeline.tsx
// Phase 2 — Session diff and provenance.
// Shows the activity log as a timeline, side-by-side rendered diffs, and a revert button.

import { useState, lazy, Suspense } from "react";
import {
  ArrowLeftRight,
  RotateCcw,
  Clock,
  Zap,
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  FileText,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityEntry } from "@/hooks/useAgentLayer";
import { diffLines, countChanges } from "@/lib/agentDiff";

const MarkdownPreview = lazy(() =>
  import("@/components/MarkdownPreview").then((m) => ({ default: m.MarkdownPreview }))
);

// ── Types ─────────────────────────────────────────────────────────────────────

interface AgentTimelineProps {
  activityLog: ActivityEntry[];
  readSnapshotContent: (path: string) => Promise<string | null>;
  readFileContent: (path: string) => Promise<string | null>;
  writeFileContent: (path: string, content: string) => Promise<{ ok: boolean; error?: string }>;
}

interface DiffViewState {
  entry: ActivityEntry;
  snapshotContent: string | null;
  currentContent: string | null;
  loading: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(isoTs: string): string {
  const diff = Date.now() - new Date(isoTs).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatTime(isoTs: string): string {
  return new Date(isoTs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(isoTs: string): string {
  return new Date(isoTs).toLocaleDateString([], { month: "short", day: "numeric" });
}

function groupByDate(entries: ActivityEntry[]): { date: string; entries: ActivityEntry[] }[] {
  const map = new Map<string, ActivityEntry[]>();
  for (const e of entries) {
    const key = formatDate(e.ts);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries())
    .map(([date, entries]) => ({ date, entries }))
    .sort((a, b) => {
      const lastA = a.entries[0]?.ts ?? "";
      const lastB = b.entries[0]?.ts ?? "";
      return lastB.localeCompare(lastA);
    });
}

// ── Diff Side-by-Side View ────────────────────────────────────────────────────

function SideBySideDiff({
  snapshotContent,
  currentContent,
}: {
  snapshotContent: string;
  currentContent: string;
}) {
  const [view, setView] = useState<"rendered" | "raw">("rendered");
  const diff = diffLines(snapshotContent, currentContent);
  const { added, removed } = countChanges(diff);

  return (
    <div className="flex flex-col h-full">
      {/* Diff stats + toggle */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 flex-shrink-0">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
            +{added}
          </span>
          <span className="text-red-500 dark:text-red-400 font-mono font-semibold">
            -{removed}
          </span>
          <span className="text-muted-foreground text-xs">lines changed</span>
        </div>
        <div className="flex rounded-md overflow-hidden border border-border text-xs">
          {(["rendered", "raw"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 transition-colors ${
                view === v
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "rendered" ? "Rendered" : "Raw diff"}
            </button>
          ))}
        </div>
      </div>

      {view === "rendered" ? (
        <div className="flex flex-1 overflow-hidden divide-x divide-border">
          {/* Before (snapshot) */}
          <div className="flex-1 overflow-auto">
            <div className="sticky top-0 bg-red-500/10 border-b border-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 z-10">
              Before (snapshot)
            </div>
            <div className="px-5 py-4">
              <Suspense fallback={<div className="text-muted-foreground text-sm p-4">Rendering…</div>}>
                <MarkdownPreview content={snapshotContent} showFrontmatter={false} />
              </Suspense>
            </div>
          </div>
          {/* After (current) */}
          <div className="flex-1 overflow-auto">
            <div className="sticky top-0 bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 z-10">
              After (current)
            </div>
            <div className="px-5 py-4">
              <Suspense fallback={<div className="text-muted-foreground text-sm p-4">Rendering…</div>}>
                <MarkdownPreview content={currentContent} showFrontmatter={false} />
              </Suspense>
            </div>
          </div>
        </div>
      ) : (
        /* Raw diff view */
        <div className="flex-1 overflow-auto p-4 font-mono text-xs">
          {diff.map((line, idx) => (
            <div
              key={idx}
              className={`px-2 py-0.5 rounded-sm leading-relaxed whitespace-pre-wrap ${
                line.type === "insert"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : line.type === "delete"
                  ? "bg-red-500/10 text-red-700 dark:text-red-300"
                  : "text-muted-foreground"
              }`}
            >
              <span className="select-none mr-2 opacity-50">
                {line.type === "insert" ? "+" : line.type === "delete" ? "-" : " "}
              </span>
              {line.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Timeline Entry Row ────────────────────────────────────────────────────────

function TimelineRow({
  entry,
  isSelected,
  onClick,
}: {
  entry: ActivityEntry;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-border/50 transition-colors hover:bg-muted/40 ${
        isSelected ? "bg-primary/8 border-l-2 border-l-primary" : ""
      }`}
    >
      <span className="text-xs font-mono text-muted-foreground w-12 flex-shrink-0">
        {formatTime(entry.ts)}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs font-medium truncate">{entry.path}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] bg-violet-500/10 text-violet-700 dark:text-violet-400 px-1.5 py-0.5 rounded font-medium">
            {entry.tool}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">{entry.hash}</span>
        </div>
      </div>

      <ChevronRight
        className={`w-3.5 h-3.5 text-muted-foreground flex-shrink-0 transition-transform ${
          isSelected ? "rotate-90" : ""
        }`}
      />
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AgentTimeline({
  activityLog,
  readSnapshotContent,
  readFileContent,
  writeFileContent,
}: AgentTimelineProps) {
  const [diffView, setDiffView] = useState<DiffViewState | null>(null);
  const [revertStatus, setRevertStatus] = useState<"idle" | "confirming" | "reverting" | "done" | "error">("idle");
  const [revertError, setRevertError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"timeline" | "digest">("timeline");

  const grouped = groupByDate([...activityLog].reverse());

  const loadDiff = async (entry: ActivityEntry) => {
    // If clicking same entry, close it
    if (diffView?.entry.ts === entry.ts && diffView.entry.path === entry.path) {
      setDiffView(null);
      return;
    }

    setDiffView({ entry, snapshotContent: null, currentContent: null, loading: true });
    setRevertStatus("idle");

    const [snapshotContent, currentContent] = await Promise.all([
      readSnapshotContent(entry.snapshot),
      readFileContent(entry.path),
    ]);

    setDiffView({ entry, snapshotContent, currentContent, loading: false });
  };

  const handleRevert = async () => {
    if (!diffView?.snapshotContent || revertStatus !== "confirming") return;
    setRevertStatus("reverting");

    const { ok, error } = await writeFileContent(diffView.entry.path, diffView.snapshotContent);
    if (ok) {
      setRevertStatus("done");
      setTimeout(() => setRevertStatus("idle"), 2500);
    } else {
      setRevertStatus("error");
      setRevertError(error ?? "Unknown error");
      setTimeout(() => setRevertStatus("idle"), 4000);
    }
  };

  if (activityLog.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <Clock className="w-10 h-10 text-muted-foreground/30" />
        <div>
          <p className="font-medium mb-1">No activity yet</p>
          <p className="text-sm text-muted-foreground">
            When Claude Code edits a <code className="bg-muted px-1 rounded text-xs">.md</code> file,
            each change will appear here with a before/after diff.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: Timeline list ─────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 border-r border-border flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-border flex-shrink-0">
          {(["timeline", "digest"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-xs py-2.5 font-medium transition-colors ${
                activeTab === tab
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "timeline" ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Clock className="w-3 h-3" /> Timeline
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <CalendarDays className="w-3 h-3" /> Digest
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === "timeline" ? (
            grouped.map(({ date, entries }) => (
              <div key={date}>
                <div className="sticky top-0 bg-background/90 backdrop-blur-sm px-4 py-1.5 border-b border-border z-10">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {date}
                  </span>
                </div>
                {entries.map((entry) => (
                  <TimelineRow
                    key={`${entry.ts}-${entry.path}`}
                    entry={entry}
                    isSelected={
                      diffView?.entry.ts === entry.ts &&
                      diffView.entry.path === entry.path
                    }
                    onClick={() => loadDiff(entry)}
                  />
                ))}
              </div>
            ))
          ) : (
            /* Daily digest — grouped by date with stats */
            <div className="p-4 space-y-4">
              {grouped.map(({ date, entries }) => {
                const paths = new Set(entries.map((e) => e.path));
                return (
                  <div key={date} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold">{date}</span>
                      <span className="text-[10px] bg-muted rounded-full px-2 py-0.5 text-muted-foreground">
                        {entries.length} edits · {paths.size} files
                      </span>
                    </div>
                    {Array.from(paths).map((path) => {
                      const fileEntries = entries.filter((e) => e.path === path);
                      return (
                        <div key={path} className="flex items-start gap-2 py-1.5 border-t border-border/50 first:border-t-0">
                          <Zap className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-medium truncate">{path}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {fileEntries.length}× · last {relativeTime(fileEntries[0].ts)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Diff view ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!diffView ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <ArrowLeftRight className="w-8 h-8 opacity-30" />
            <p className="text-sm">Select a change to view the diff</p>
          </div>
        ) : (
          <>
            {/* Diff header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2 text-sm min-w-0">
                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium truncate">{diffView.entry.path}</span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-muted-foreground text-xs">{relativeTime(diffView.entry.ts)}</span>
              </div>

              {/* Revert controls */}
              {diffView.snapshotContent && !diffView.loading && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {revertStatus === "idle" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRevertStatus("confirming")}
                      className="gap-1.5 text-xs h-7"
                    >
                      <RotateCcw className="w-3 h-3" /> Revert
                    </Button>
                  )}
                  {revertStatus === "confirming" && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        Restore snapshot?
                      </span>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleRevert}
                        className="h-7 text-xs"
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRevertStatus("idle")}
                        className="h-7 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  {revertStatus === "reverting" && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" /> Reverting…
                    </div>
                  )}
                  {revertStatus === "done" && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Reverted
                    </div>
                  )}
                  {revertStatus === "error" && (
                    <div className="flex items-center gap-1.5 text-xs text-destructive">
                      <AlertTriangle className="w-3.5 h-3.5" /> {revertError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Diff body */}
            <div className="flex-1 overflow-hidden">
              {diffView.loading ? (
                <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading diff…
                </div>
              ) : diffView.snapshotContent === null ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                  <p className="text-sm">Snapshot not found — may have been pruned.</p>
                </div>
              ) : (
                <SideBySideDiff
                  snapshotContent={diffView.snapshotContent}
                  currentContent={diffView.currentContent ?? ""}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
