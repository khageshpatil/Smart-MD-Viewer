#!/usr/bin/env node
// .claude/hooks/notify.js
// PostToolUse hook — appends one line to the activity log.
// Claude Code calls this after Write, Edit, or MultiEdit.
// stdin: JSON describing the tool call result.
// Exits immediately. Nothing stays resident.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const LOG_PATH = path.join(process.cwd(), ".claude", "md-activity.jsonl");

async function main() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    // Malformed stdin — exit silently. Never block the agent.
    process.exit(0);
  }

  // ── Extract fields from the hook payload ────────────────────────────────
  // NOTE: Claude Code hook schema is young; all access is defensive.
  // If the shape changes, fix only this block.
  const toolName = payload?.tool_name ?? payload?.tool ?? "unknown";
  const toolInput = payload?.tool_input ?? payload?.input ?? {};
  const filePath =
    toolInput?.path ?? toolInput?.file_path ?? toolInput?.filename ?? null;

  // Only log .md file operations
  if (!filePath || !filePath.endsWith(".md")) {
    process.exit(0);
  }

  // Resolve to a path relative to cwd for portability
  const relPath = path.relative(process.cwd(), path.resolve(filePath));

  // Compute hash of the file as it now exists (post-write)
  let hash = "";
  try {
    const content = fs.readFileSync(path.resolve(filePath));
    hash = crypto.createHash("sha256").update(content).digest("hex").slice(0, 8);
  } catch {
    hash = "unreadable";
  }

  // Determine snapshot path (written by snapshot.js in PreToolUse)
  const sessionId = process.env.CLAUDE_SESSION_ID ?? process.env.SESSION_ID ?? "unknown";
  const ts = new Date().toISOString();
  const snapshotBase = ts.replace(/[:.]/g, "").replace("T", "-").slice(0, 15);
  const snapshotPath = path.join(
    ".claude",
    "md-snapshots",
    sessionId,
    `${path.basename(filePath)}.${snapshotBase}`
  );

  const entry = {
    ts,
    session: sessionId,
    tool: toolName,
    path: relPath,
    hash,
    snapshot: snapshotPath,
  };

  // Ensure the log directory exists
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });

  // Append-only — never rewrite
  fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + "\n", "utf8");

  process.exit(0);
}

main().catch(() => process.exit(0)); // Never crash. Never block.
