#!/usr/bin/env node
// .claude/hooks/mcp.js
// Phase 4 — Smart MD MCP server.
// Runs only while a Claude Code session is active. Claude Code spawns it and kills it.
//
// Register once with:
//   claude mcp add smart-md -- node /path/to/.claude/hooks/mcp.js
//
// Implements the MCP protocol over stdio (JSON-RPC 2.0).
// No external dependencies — pure Node.js.

"use strict";

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const crypto = require("crypto");

// ── Constants ──────────────────────────────────────────────────────────────────

const IGNORE_DIRS = new Set([
  "node_modules", ".git", "build", "dist", ".next",
  "out", ".vite", ".turbo", "coverage", ".cache",
]);

const INBOX_CAP = 50;
const MEMORY_INBOX = ".claude/memory/inbox";

// ── File system helpers ────────────────────────────────────────────────────────

function findMdFiles(dir, prefix = "") {
  const results = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      results.push(...findMdFiles(fullPath, relPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(relPath);
    }
  }
  return results;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, body: content };

  const yaml = match[1];
  const body = match[2];
  const data = {};

  for (const line of yaml.split("\n")) {
    const l = line.trim();
    if (!l || l.startsWith("#")) continue;
    const colonIdx = l.indexOf(":");
    if (colonIdx === -1) continue;
    const key = l.slice(0, colonIdx).trim();
    const rawVal = l.slice(colonIdx + 1).trim();
    if (!rawVal) continue;

    if (rawVal.startsWith("[") && rawVal.endsWith("]")) {
      data[key] = rawVal.slice(1, -1).split(",").map(v => v.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    } else {
      data[key] = rawVal.replace(/^["']|["']$/g, "");
    }
  }
  return { data, body };
}

function estimateTokens(content) {
  const bytes = Buffer.byteLength(content, "utf8");
  const hasCode = /```/.test(content);
  return Math.round(bytes / (hasCode ? 3.2 : 4));
}

function extractHeadings(content) {
  const headings = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s+(.+)/);
    if (m) {
      headings.push({ level: m[1].length, text: m[2].trim(), line: i + 1 });
    }
  }
  return headings;
}

function getSection(content, heading) {
  const lines = content.split("\n");
  let startLine = -1;
  let headingLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s+(.+)/);
    if (m && m[2].trim().toLowerCase() === heading.toLowerCase()) {
      startLine = i;
      headingLevel = m[1].length;
      break;
    }
  }

  if (startLine === -1) return null;

  const sectionLines = [lines[startLine]];
  for (let i = startLine + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s/);
    if (m && m[1].length <= headingLevel) break;
    sectionLines.push(lines[i]);
  }

  return sectionLines.join("\n");
}

// ── Tool implementations ───────────────────────────────────────────────────────

function list_docs({ root: rootArg } = {}) {
  const root = rootArg || process.cwd();
  const files = findMdFiles(root);
  const docs = [];

  for (const relPath of files.slice(0, 200)) { // cap at 200 for safety
    try {
      const content = fs.readFileSync(path.join(root, relPath), "utf8");
      const { data, body } = parseFrontmatter(content);
      const headings = extractHeadings(content);
      docs.push({
        path: relPath,
        title: data.name || headings[0]?.text || relPath,
        description: data.description || "",
        headings: headings.slice(0, 10),
        tokens: estimateTokens(content),
      });
    } catch {
      // Skip unreadable
    }
  }

  return { docs, total: files.length };
}

function search_docs({ query, limit = 10 } = {}) {
  const root = process.cwd();
  if (!query) return { results: [] };

  const files = findMdFiles(root);
  const results = [];
  const queryLower = query.toLowerCase();

  for (const relPath of files) {
    if (results.length >= limit) break;
    try {
      const content = fs.readFileSync(path.join(root, relPath), "utf8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(queryLower)) {
          // Find the nearest heading above this line
          let nearestHeading = "";
          for (let j = i; j >= 0; j--) {
            const m = lines[j].match(/^#{1,6}\s+(.+)/);
            if (m) { nearestHeading = m[1].trim(); break; }
          }

          // Snippet: this line + 1 context line each side
          const snippet = lines
            .slice(Math.max(0, i - 1), i + 2)
            .join("\n")
            .trim();

          results.push({
            path: relPath,
            heading: nearestHeading,
            snippet,
            line_start: i + 1,
          });

          if (results.length >= limit) break;
        }
      }
    } catch {
      // Skip
    }
  }

  return { results };
}

function get_section({ path: relPath, heading } = {}) {
  const root = process.cwd();
  if (!relPath || !heading) return { error: "path and heading are required" };

  try {
    const content = fs.readFileSync(path.join(root, relPath), "utf8");
    const section = getSection(content, heading);
    if (!section) return { error: `Heading "${heading}" not found in ${relPath}` };
    return { path: relPath, heading, content: section, tokens: estimateTokens(section) };
  } catch {
    return { error: `Could not read file: ${relPath}` };
  }
}

function validate_skills() {
  const root = process.cwd();
  const skillFiles = findMdFiles(root).filter(f => f.endsWith("SKILL.md"));

  const issues = [];
  const skills = [];

  for (const relPath of skillFiles) {
    try {
      const content = fs.readFileSync(path.join(root, relPath), "utf8");
      const { data, body } = parseFrontmatter(content);
      const dir = path.dirname(relPath);

      // Missing frontmatter
      if (!data.name) {
        issues.push({ severity: "error", code: "MISSING_NAME", file: relPath, message: "Missing `name` in frontmatter" });
      }
      if (!data.description) {
        issues.push({ severity: "error", code: "MISSING_DESCRIPTION", file: relPath, message: "Missing `description` in frontmatter" });
      }

      // Broken relative links
      const linkRe = /\[([^\]]*)\]\(([^)]+)\)/g;
      let m;
      while ((m = linkRe.exec(body)) !== null) {
        const href = m[2].trim();
        if (href.startsWith("http") || href.startsWith("mailto")) continue;
        const resolvedPath = path.join(root, dir, href);
        if (!fs.existsSync(resolvedPath)) {
          issues.push({
            severity: "error",
            code: "BROKEN_LINK",
            file: relPath,
            message: `Broken link: \`${href}\` not found at \`${resolvedPath}\``,
          });
        }
      }

      skills.push({
        path: relPath,
        name: data.name ?? null,
        description: data.description ?? null,
        tokens: estimateTokens(content),
        issueCount: issues.filter(i => i.file === relPath).length,
      });
    } catch {
      issues.push({ severity: "error", code: "UNREADABLE", file: relPath, message: "Could not read file" });
    }
  }

  return { skills, issues, total: skillFiles.length };
}

function propose_memory({ text, tags = [] } = {}) {
  const root = process.cwd();
  if (!text) return { error: "text is required" };

  // Check inbox cap
  const inboxDir = path.join(root, MEMORY_INBOX);
  let inboxCount = 0;
  try {
    inboxCount = fs.readdirSync(inboxDir).filter(f => f.endsWith(".md")).length;
  } catch {/* no inbox yet, count = 0 */}

  if (inboxCount >= INBOX_CAP) {
    return {
      error: `Inbox is at capacity (${INBOX_CAP} items). The human must review pending items before new memories can be proposed.`,
    };
  }

  const id = `${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}-${crypto.randomBytes(3).toString("hex")}`;
  const filePath = path.join(root, MEMORY_INBOX, `${id}.md`);
  const sessionId = process.env.CLAUDE_SESSION_ID ?? process.env.SESSION_ID ?? "unknown";

  const content = `---
date: ${new Date().toISOString()}
session: ${sessionId}
source: agent
status: pending
tags: [${tags.join(", ")}]
---

${text.trim()}
`;

  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, "utf8");
    return { id, path: path.relative(root, filePath), inbox_count: inboxCount + 1 };
  } catch (err) {
    return { error: err.message };
  }
}

// ── Tool registry ─────────────────────────────────────────────────────────────

const TOOLS = {
  list_docs: {
    description: "List all Markdown files in the repo with titles, descriptions, headings, and token estimates. Use this first to get a cheap map of what exists.",
    inputSchema: {
      type: "object",
      properties: {
        root: { type: "string", description: "Optional root path override (defaults to cwd)" },
      },
    },
    handler: list_docs,
  },
  search_docs: {
    description: "Search Markdown files by query string. Returns matching SECTIONS with snippets, not whole files. Use this instead of reading full files.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        limit: { type: "number", description: "Max results (default 10)" },
      },
      required: ["query"],
    },
    handler: search_docs,
  },
  get_section: {
    description: "Get the text of a specific section from a Markdown file by heading name. Returns only that section, saving context tokens.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative file path (e.g. docs/conventions.md)" },
        heading: { type: "string", description: "The heading text to extract (case-insensitive)" },
      },
      required: ["path", "heading"],
    },
    handler: get_section,
  },
  validate_skills: {
    description: "Run the skill linter. Returns all SKILL.md files with issue reports: broken links, missing frontmatter fields. Use this to check skill files before modifying them.",
    inputSchema: { type: "object", properties: {} },
    handler: validate_skills,
  },
  propose_memory: {
    description: "Propose a new memory for human review. Writes to .claude/memory/inbox/. The human must approve it before it becomes active. Fails if inbox is at capacity (50 items).",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "The fact or observation to remember" },
        tags: { type: "array", items: { type: "string" }, description: "Topic tags e.g. [testing, tooling]" },
      },
      required: ["text"],
    },
    handler: propose_memory,
  },
};

// ── JSON-RPC 2.0 server ────────────────────────────────────────────────────────

function jsonRpcSuccess(id, result) {
  return JSON.stringify({ jsonrpc: "2.0", id, result });
}

function jsonRpcError(id, code, message) {
  return JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } });
}

function handleRequest(raw) {
  let req;
  try {
    req = JSON.parse(raw);
  } catch {
    return jsonRpcError(null, -32700, "Parse error");
  }

  const { id, method, params = {} } = req;

  switch (method) {
    case "initialize":
      return jsonRpcSuccess(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "smart-md", version: "1.0.0" },
      });

    case "tools/list":
      return jsonRpcSuccess(id, {
        tools: Object.entries(TOOLS).map(([name, t]) => ({
          name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      });

    case "tools/call": {
      const { name, arguments: args = {} } = params;
      const tool = TOOLS[name];
      if (!tool) {
        return jsonRpcError(id, -32601, `Unknown tool: ${name}`);
      }
      try {
        const result = tool.handler(args);
        return jsonRpcSuccess(id, {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        });
      } catch (err) {
        return jsonRpcError(id, -32000, err.message);
      }
    }

    case "notifications/initialized":
      return null; // No response needed for notifications

    case "ping":
      return jsonRpcSuccess(id, {});

    default:
      return jsonRpcError(id, -32601, `Method not found: ${method}`);
  }
}

// ── Main: read from stdin, write to stdout ─────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, terminal: false });

rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  const response = handleRequest(trimmed);
  if (response !== null) {
    process.stdout.write(response + "\n");
  }
});

rl.on("close", () => {
  process.exit(0);
});

// Silence uncaught errors — MCP server must never crash noisily
process.on("uncaughtException", () => {});
process.on("unhandledRejection", () => {});
