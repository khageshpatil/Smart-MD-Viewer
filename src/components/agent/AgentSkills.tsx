// src/components/agent/AgentSkills.tsx
// Phase 3 — Skill registry and linter.
// Scans all SKILL.md files, checks them for issues, shows the token budget.

import { useState, useCallback } from "react";
import {
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Cpu,
  Zap,
  Info,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  scanSkills,
  scanAlwaysLoadedFiles,
  SkillFile,
  LintIssue,
  COLLISION_THRESHOLD,
} from "@/lib/skillLinter";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AgentSkillsProps {
  getRootHandle: () => FileSystemDirectoryHandle | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

function issueIcon(severity: LintIssue["severity"]) {
  switch (severity) {
    case "error":
      return <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />;
    case "warning":
      return <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />;
    default:
      return <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />;
  }
}

function issueColor(severity: LintIssue["severity"]) {
  switch (severity) {
    case "error":
      return "text-destructive";
    case "warning":
      return "text-amber-600 dark:text-amber-400";
    default:
      return "text-blue-600 dark:text-blue-400";
  }
}

function totalIssues(skills: SkillFile[]): { errors: number; warnings: number } {
  let errors = 0;
  let warnings = 0;
  for (const s of skills) {
    for (const i of s.issues) {
      if (i.severity === "error") errors++;
      else if (i.severity === "warning") warnings++;
    }
  }
  return { errors, warnings };
}

// ── Token budget bar ──────────────────────────────────────────────────────────

function TokenBar({ tokens, max }: { tokens: number; max: number }) {
  const pct = Math.min(100, (tokens / max) * 100);
  const color =
    pct > 66
      ? "bg-red-500"
      : pct > 33
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full ${color} transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Skill card ────────────────────────────────────────────────────────────────

function SkillCard({ skill }: { skill: SkillFile }) {
  const [expanded, setExpanded] = useState(false);
  const hasIssues = skill.issues.length > 0;
  const errors = skill.issues.filter((i) => i.severity === "error").length;
  const warnings = skill.issues.filter((i) => i.severity === "warning").length;

  const tools =
    skill.frontmatter["allowed-tools"] ??
    skill.frontmatter["tools"] ??
    [];

  return (
    <div
      className={`rounded-xl border transition-colors ${
        errors > 0
          ? "border-destructive/40 bg-destructive/5"
          : warnings > 0
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-border bg-muted/20"
      }`}
    >
      <button
        className="w-full text-left px-4 py-3 flex items-start gap-3"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">
              {skill.frontmatter.name ?? <em className="text-muted-foreground">No name</em>}
            </span>
            {errors > 0 && (
              <span className="text-[10px] bg-destructive/10 text-destructive border border-destructive/20 px-1.5 py-0.5 rounded-full font-medium">
                {errors} error{errors !== 1 ? "s" : ""}
              </span>
            )}
            {warnings > 0 && (
              <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-medium">
                {warnings} warning{warnings !== 1 ? "s" : ""}
              </span>
            )}
            {!hasIssues && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-medium">
                ✓ Clean
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {skill.frontmatter.description ?? (
              <em className="text-red-500">No description</em>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 text-xs text-muted-foreground">
          <span className="font-mono">~{formatTokens(skill.tokenEstimate)} tok</span>
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">
          {/* Path */}
          <div className="text-[10px] font-mono text-muted-foreground bg-muted rounded px-2 py-1">
            {skill.path}
          </div>

          {/* Tools */}
          {Array.isArray(tools) && tools.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tools.map((t: string) => (
                <span
                  key={t}
                  className="text-[10px] bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* References */}
          {skill.references.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                References ({skill.references.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {skill.references.map((r, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Issues */}
          {skill.issues.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Issues
              </div>
              <div className="space-y-1.5">
                {skill.issues.map((issue, idx) => (
                  <div key={idx} className={`flex items-start gap-2 text-xs ${issueColor(issue.severity)}`}>
                    {issueIcon(issue.severity)}
                    <span className="leading-relaxed">{issue.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AgentSkills({ getRootHandle }: AgentSkillsProps) {
  const [scanning, setScanning] = useState(false);
  const [skills, setSkills] = useState<SkillFile[] | null>(null);
  const [alwaysLoaded, setAlwaysLoaded] = useState<
    { path: string; bytes: number; tokenEstimate: boolean; tokens: number }[]
  >([]);
  const [activeTab, setActiveTab] = useState<"registry" | "budget">("registry");

  const runScan = useCallback(async () => {
    const root = getRootHandle();
    if (!root) return;

    setScanning(true);
    try {
      const [found, loaded] = await Promise.all([
        scanSkills(root),
        scanAlwaysLoadedFiles(root),
      ]);
      setSkills(found);
      setAlwaysLoaded(loaded);
    } finally {
      setScanning(false);
    }
  }, [getRootHandle]);

  const { errors, warnings } =
    skills !== null ? totalIssues(skills) : { errors: 0, warnings: 0 };

  const maxTokens = Math.max(...(alwaysLoaded.map((f) => f.tokens) ?? [1]), 1);

  if (skills === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
          <Zap className="w-7 h-7 text-violet-500" />
        </div>
        <div>
          <h3 className="font-bold text-lg mb-1.5">Skill Registry & Linter</h3>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            Scans every <code className="bg-muted px-1 rounded text-xs">SKILL.md</code> in the
            connected repo. Checks for broken links, description collisions ({Math.round(COLLISION_THRESHOLD * 100)}%+
            Jaccard similarity), missing frontmatter, orphan files, and missing scripts.
          </p>
        </div>
        <Button onClick={runScan} disabled={scanning} className="gap-2">
          {scanning ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Scanning…</>
          ) : (
            <><Zap className="w-4 h-4" /> Scan Skills</>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Summary badges */}
          <span className="text-sm font-medium">{skills.length} skills</span>
          {errors > 0 && (
            <span className="text-xs flex items-center gap-1 text-destructive">
              <AlertCircle className="w-3.5 h-3.5" /> {errors} error{errors !== 1 ? "s" : ""}
            </span>
          )}
          {warnings > 0 && (
            <span className="text-xs flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" /> {warnings} warning{warnings !== 1 ? "s" : ""}
            </span>
          )}
          {errors === 0 && warnings === 0 && (
            <span className="text-xs flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> All clean
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Tab switcher */}
          <div className="flex rounded-md overflow-hidden border border-border text-xs">
            {(["registry", "budget"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 transition-colors ${
                  activeTab === t
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "registry" ? "Registry" : "Token Budget"}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={runScan}
            disabled={scanning}
            className="gap-1.5 text-xs h-7"
          >
            {scanning ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            Rescan
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "registry" ? (
          <div className="space-y-3 max-w-3xl">
            {skills.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No SKILL.md files found in the connected repo.
              </div>
            ) : (
              skills.map((skill) => <SkillCard key={skill.path} skill={skill} />)
            )}
          </div>
        ) : (
          /* Token Budget View */
          <div className="max-w-2xl space-y-4">
            {/* Always-loaded files */}
            {alwaysLoaded.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  Always-loaded files (every session)
                </div>
                <div className="rounded-xl border border-border overflow-hidden">
                  {alwaysLoaded.map((f, idx) => (
                    <div
                      key={f.path}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        idx !== alwaysLoaded.length - 1 ? "border-b border-border/50" : ""
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-mono flex-shrink-0 w-52 truncate">
                        {f.path}
                      </span>
                      <TokenBar tokens={f.tokens} max={maxTokens} />
                      <span className="text-xs font-mono text-muted-foreground flex-shrink-0 w-16 text-right">
                        ~{formatTokens(f.tokens)} tok
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-t border-border">
                    <span className="text-xs text-muted-foreground">Total per session</span>
                    <span className="text-xs font-mono font-semibold">
                      ~{formatTokens(alwaysLoaded.reduce((s, f) => s + f.tokens, 0))} tokens
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Skill files token usage */}
            {skills.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Skill files (loaded on demand)
                </div>
                <div className="rounded-xl border border-border overflow-hidden">
                  {skills.map((skill, idx) => (
                    <div
                      key={skill.path}
                      className={`flex items-center gap-3 px-4 py-2.5 ${
                        idx !== skills.length - 1 ? "border-b border-border/50" : ""
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs font-mono flex-shrink-0 w-52 truncate text-muted-foreground">
                        {skill.path}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-violet-500 transition-all"
                          style={{
                            width: `${Math.min(100, (skill.tokenEstimate / (alwaysLoaded[0]?.tokens || skill.tokenEstimate)) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground flex-shrink-0 w-16 text-right">
                        ~{formatTokens(skill.tokenEstimate)} tok
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground italic">
              Token counts are estimates (≈ bytes ÷ 4 for prose, ÷ 3.2 for code-heavy files).
              Actual counts vary by model tokenizer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
