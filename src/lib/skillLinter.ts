// src/lib/skillLinter.ts
// Skill registry scanner and linter. Runs entirely in the browser via
// FileSystem Access API. Zero external dependencies.

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SkillFrontmatter {
  name?: string;
  description?: string;
  "allowed-tools"?: string[];
  tools?: string[];
  [key: string]: unknown;
}

export interface SkillFile {
  path: string; // relative path of SKILL.md
  dir: string;  // directory containing the skill
  frontmatter: SkillFrontmatter;
  body: string;
  bytes: number;
  tokenEstimate: number;
  references: string[]; // links found in the body
  issues: LintIssue[];
}

export type LintSeverity = "error" | "warning" | "info";

export interface LintIssue {
  severity: LintSeverity;
  code: string;
  message: string;
  file?: string; // the file that has the issue
}

// ── Simple YAML frontmatter parser ────────────────────────────────────────────

export function parseFrontmatter(content: string): {
  data: SkillFrontmatter;
  body: string;
} {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, body: content };

  const yaml = match[1];
  const body = match[2];
  const data: SkillFrontmatter = {};

  for (const rawLine of yaml.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    const rawVal = line.slice(colonIdx + 1).trim();

    if (!rawVal) {
      data[key] = undefined;
      continue;
    }

    // Inline array: [a, b, c]
    if (rawVal.startsWith("[") && rawVal.endsWith("]")) {
      data[key] = rawVal
        .slice(1, -1)
        .split(",")
        .map((v) => v.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      data[key] = rawVal.replace(/^["']|["']$/g, "");
    }
  }

  return { data, body };
}

// ── Jaccard trigram similarity ─────────────────────────────────────────────────

function trigrams(text: string): Set<string> {
  const s = text.toLowerCase().replace(/\s+/g, " ").trim();
  const result = new Set<string>();
  for (let i = 0; i <= s.length - 3; i++) {
    result.add(s.slice(i, i + 3));
  }
  return result;
}

export function jaccardSimilarity(a: string, b: string): number {
  const ta = trigrams(a);
  const tb = trigrams(b);
  if (ta.size === 0 && tb.size === 0) return 1;
  if (ta.size === 0 || tb.size === 0) return 0;

  let intersection = 0;
  for (const t of ta) {
    if (tb.has(t)) intersection++;
  }

  const union = ta.size + tb.size - intersection;
  return intersection / union;
}

export const COLLISION_THRESHOLD = 0.4;

// ── Extract markdown links ─────────────────────────────────────────────────────

function extractLinks(markdown: string): string[] {
  const links: string[] = [];

  // Standard markdown links: [text](path)
  const linkRe = /\[([^\]]*)\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(markdown)) !== null) {
    const href = m[2].trim();
    // Only relative links (not http:// or mailto:)
    if (!href.startsWith("http") && !href.startsWith("mailto")) {
      links.push(href);
    }
  }

  // Code block references: `references/foo.md`
  const codeRe = /`((?:references|scripts|docs)\/[^`]+)`/g;
  while ((m = codeRe.exec(markdown)) !== null) {
    links.push(m[1].trim());
  }

  return links;
}

// ── Token estimate ─────────────────────────────────────────────────────────────

export function estimateTokens(bytes: number, hasCode: boolean): number {
  // Prose: ~bytes/4, code-heavy: ~bytes/3
  const divisor = hasCode ? 3.2 : 4;
  return Math.round(bytes / divisor);
}

const CODE_BLOCK_RE = /```[\s\S]*?```/g;

// ── File system helpers ────────────────────────────────────────────────────────

async function fileExists(
  root: FileSystemDirectoryHandle,
  relPath: string
): Promise<boolean> {
  const parts = relPath.split("/");
  let current: FileSystemDirectoryHandle = root;
  try {
    for (let i = 0; i < parts.length - 1; i++) {
      current = await current.getDirectoryHandle(parts[i]);
    }
    await current.getFileHandle(parts[parts.length - 1]);
    return true;
  } catch {
    return false;
  }
}

async function listDir(
  handle: FileSystemDirectoryHandle
): Promise<{ name: string; kind: "file" | "directory" }[]> {
  const result: { name: string; kind: "file" | "directory" }[] = [];
  for await (const [name, entry] of (handle as any).entries()) {
    result.push({ name, kind: entry.kind });
  }
  return result;
}

async function readFile(
  root: FileSystemDirectoryHandle,
  relPath: string
): Promise<string | null> {
  const parts = relPath.split("/");
  let current: FileSystemDirectoryHandle = root;
  try {
    for (let i = 0; i < parts.length - 1; i++) {
      current = await current.getDirectoryHandle(parts[i]);
    }
    const fh = await current.getFileHandle(parts[parts.length - 1]);
    const file = await fh.getFile();
    return file.text();
  } catch {
    return null;
  }
}

// ── Main scanner ──────────────────────────────────────────────────────────────

const IGNORE_DIRS = new Set([
  "node_modules", ".git", "build", "dist", ".next",
  "out", ".vite", ".turbo", "coverage", ".cache",
]);

async function findSkillFiles(
  root: FileSystemDirectoryHandle,
  dirHandle: FileSystemDirectoryHandle,
  prefix = ""
): Promise<{ relSkillPath: string; dirPath: string }[]> {
  const results: { relSkillPath: string; dirPath: string }[] = [];
  for await (const [name, entry] of (dirHandle as any).entries()) {
    if (IGNORE_DIRS.has(name)) continue;

    if (entry.kind === "directory") {
      try {
        const sub = await dirHandle.getDirectoryHandle(name);
        const subPath = prefix ? `${prefix}/${name}` : name;
        const nested = await findSkillFiles(root, sub, subPath);
        results.push(...nested);
      } catch {/* skip unreadable */}
    } else if (name === "SKILL.md") {
      const dirPath = prefix;
      const relSkillPath = prefix ? `${prefix}/SKILL.md` : "SKILL.md";
      results.push({ relSkillPath, dirPath });
    }
  }
  return results;
}

/** Scan all SKILL.md files in the repo and lint them. */
export async function scanSkills(root: FileSystemDirectoryHandle): Promise<SkillFile[]> {
  const found = await findSkillFiles(root, root);
  const skills: SkillFile[] = [];

  for (const { relSkillPath, dirPath } of found) {
    const content = await readFile(root, relSkillPath);
    if (content === null) continue;

    const { data: frontmatter, body } = parseFrontmatter(content);
    const bytes = new TextEncoder().encode(content).length;
    const hasCode = CODE_BLOCK_RE.test(body);
    CODE_BLOCK_RE.lastIndex = 0;
    const tokenEstimate = estimateTokens(bytes, hasCode);
    const references = extractLinks(body);

    const issues: LintIssue[] = [];

    // ── Check 1: Missing frontmatter fields ──
    if (!frontmatter.name) {
      issues.push({
        severity: "error",
        code: "MISSING_NAME",
        message: "No `name` field in frontmatter.",
        file: relSkillPath,
      });
    }
    if (!frontmatter.description) {
      issues.push({
        severity: "error",
        code: "MISSING_DESCRIPTION",
        message: "No `description` field in frontmatter.",
        file: relSkillPath,
      });
    }

    // ── Check 2: Broken relative links ──
    for (const link of references) {
      // Resolve relative to the skill's directory
      const resolvedPath = dirPath ? `${dirPath}/${link}` : link;
      const exists = await fileExists(root, resolvedPath);
      if (!exists) {
        issues.push({
          severity: "error",
          code: "BROKEN_LINK",
          message: `Broken link: \`${link}\` not found at \`${resolvedPath}\``,
          file: relSkillPath,
        });
      }
    }

    // ── Check 4: Orphan files in references/ ──
    if (dirPath) {
      try {
        const refDirHandle = await root.getDirectoryHandle(
          dirPath + "/references"
        );
        const refFiles = await listDir(refDirHandle);
        for (const rf of refFiles) {
          if (rf.kind !== "file") continue;
          const refRelPath = `references/${rf.name}`;
          const isLinked = references.some((r) => r === refRelPath || r.endsWith(rf.name));
          if (!isLinked) {
            issues.push({
              severity: "warning",
              code: "ORPHAN_FILE",
              message: `Orphan file: \`${rf.name}\` is in references/ but not linked from SKILL.md`,
              file: relSkillPath,
            });
          }
        }
      } catch {/* no references/ dir, that's fine */}
    }

    // ── Check 5: Missing referenced scripts ──
    const scriptRefs = references.filter((r) => r.startsWith("scripts/"));
    for (const scriptRef of scriptRefs) {
      const resolvedPath = dirPath ? `${dirPath}/${scriptRef}` : scriptRef;
      const exists = await fileExists(root, resolvedPath);
      if (!exists) {
        issues.push({
          severity: "error",
          code: "MISSING_SCRIPT",
          message: `Missing script: \`${scriptRef}\` referenced but not found.`,
          file: relSkillPath,
        });
      }
    }

    skills.push({
      path: relSkillPath,
      dir: dirPath,
      frontmatter,
      body,
      bytes,
      tokenEstimate,
      references,
      issues,
    });
  }

  // ── Check 3: Description collisions (cross-skill) ──
  for (let i = 0; i < skills.length; i++) {
    for (let j = i + 1; j < skills.length; j++) {
      const a = skills[i].frontmatter.description ?? "";
      const b = skills[j].frontmatter.description ?? "";
      if (!a || !b) continue;

      const score = jaccardSimilarity(a, b);
      if (score >= COLLISION_THRESHOLD) {
        const issue: LintIssue = {
          severity: "warning",
          code: "DESCRIPTION_COLLISION",
          message: `Description similarity ${Math.round(score * 100)}% with \`${skills[j].path}\` — agent may not be able to distinguish them.`,
          file: skills[i].path,
        };
        const issueB: LintIssue = {
          severity: "warning",
          code: "DESCRIPTION_COLLISION",
          message: `Description similarity ${Math.round(score * 100)}% with \`${skills[i].path}\` — agent may not be able to distinguish them.`,
          file: skills[j].path,
        };
        skills[i].issues.push(issue);
        skills[j].issues.push(issueB);
      }
    }
  }

  // Sort by token estimate descending (token budget view)
  skills.sort((a, b) => b.tokenEstimate - a.tokenEstimate);

  return skills;
}

/** Also scan "always-loaded" files for the token budget view. */
export async function scanAlwaysLoadedFiles(
  root: FileSystemDirectoryHandle
): Promise<{ path: string; bytes: number; tokenEstimate: boolean; tokens: number }[]> {
  const candidates = [
    "CLAUDE.md",
    "README.md",
    "docs/conventions.md",
    "docs/testing-conventions.md",
    ".claude/CLAUDE.md",
  ];

  const result: { path: string; bytes: number; tokenEstimate: boolean; tokens: number }[] = [];

  for (const candidate of candidates) {
    const content = await readFile(root, candidate);
    if (content === null) continue;

    const bytes = new TextEncoder().encode(content).length;
    const hasCode = CODE_BLOCK_RE.test(content);
    CODE_BLOCK_RE.lastIndex = 0;
    result.push({
      path: candidate,
      bytes,
      tokenEstimate: true,
      tokens: estimateTokens(bytes, hasCode),
    });
  }

  // Sort by token desc
  result.sort((a, b) => b.tokens - a.tokens);
  return result;
}
