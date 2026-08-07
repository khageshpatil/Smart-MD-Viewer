#!/usr/bin/env node
// .claude/hooks/snapshot.js
// PreToolUse hook — copies the target file into the snapshot folder BEFORE
// the agent overwrites it. This is what makes diffs possible with no database.
// Claude Code calls this before Write, Edit, or MultiEdit.
// stdin: JSON describing the tool call input.
// Exits immediately. Nothing stays resident.

const fs = require("fs");
const path = require("path");

async function main() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  // ── Extract file path from the hook payload ──────────────────────────────
  // NOTE: All access is defensive — hook schema is young API surface.
  // If the shape changes, fix only this block.
  const toolInput = payload?.tool_input ?? payload?.input ?? {};
  const filePath =
    toolInput?.path ?? toolInput?.file_path ?? toolInput?.filename ?? null;

  // Only snapshot .md files
  if (!filePath || !filePath.endsWith(".md")) {
    process.exit(0);
  }

  const absPath = path.resolve(filePath);

  // File must exist to snapshot (Write creates new files; those have no before)
  if (!fs.existsSync(absPath)) {
    process.exit(0);
  }

  const sessionId = process.env.CLAUDE_SESSION_ID ?? process.env.SESSION_ID ?? "unknown";
  const ts = new Date().toISOString();
  // Compact timestamp: 20260806-142311
  const snapshotBase = ts.replace(/[:.]/g, "").replace("T", "-").slice(0, 15);

  const snapshotDir = path.join(
    process.cwd(),
    ".claude",
    "md-snapshots",
    sessionId
  );

  fs.mkdirSync(snapshotDir, { recursive: true });

  const snapshotFile = path.join(
    snapshotDir,
    `${path.basename(filePath)}.${snapshotBase}`
  );

  try {
    fs.copyFileSync(absPath, snapshotFile);
  } catch {
    // Failed to copy — exit silently. Never block the agent.
  }

  process.exit(0);
}

main().catch(() => process.exit(0)); // Never crash. Never block.
