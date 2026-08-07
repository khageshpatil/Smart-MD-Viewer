# Smart MD — Claude Code Hooks & MCP Server

This directory wires **Smart MD Viewer** into your Claude Code session.
Copy this entire `.claude/` folder into any repo where you use Claude Code.

---

## Files

| File | What it does |
|---|---|
| `hooks/notify.js` | PostToolUse — appends one line to `.claude/md-activity.jsonl` after every `.md` edit |
| `hooks/snapshot.js` | PreToolUse — copies the file to `.claude/md-snapshots/` before it is overwritten |
| `hooks/mcp.js` | MCP server — gives Claude tools to search your docs without reading full files |
| `settings.json` | Registers notify + snapshot hooks with Claude Code |

---

## Setup (one-time, per repo)

### 1. Copy hooks
Copy this `.claude/` folder into your repo root:
```
your-repo/
  .claude/
    hooks/
      notify.js
      snapshot.js
      mcp.js
    settings.json
    README.md      ← this file
```

### 2. Register MCP server (optional but recommended)
```bash
claude mcp add smart-md -- node /absolute/path/to/.claude/hooks/mcp.js
```
Or per-project, add to your `.mcp.json`:
```json
{
  "mcpServers": {
    "smart-md": {
      "command": "node",
      "args": [".claude/hooks/mcp.js"]
    }
  }
}
```

### 3. Open the Agent Layer
Navigate to `http://localhost:8080/agent` (or your deployed Smart MD URL) and click **Connect Repo Folder**.

---

## What gets logged

Each edit to a `.md` file appends one JSON line to `.claude/md-activity.jsonl`:
```json
{
  "ts": "2026-08-06T00:15:23.000Z",
  "session": "abc123",
  "tool": "Edit",
  "path": "docs/conventions.md",
  "hash": "a1b2c3d4",
  "snapshot": ".claude/md-snapshots/abc123/conventions.md.20260806-001523"
}
```

The Smart MD viewer polls this file every 2 seconds and shows you what changed.

---

## MCP tools

| Tool | What it does |
|---|---|
| `list_docs` | Map of all `.md` files — titles, headings, token counts. Read this first. |
| `search_docs` | Search by query — returns matching sections with snippets. |
| `get_section` | Extract one heading's content from a file. |
| `validate_skills` | Run the skill linter — broken links, missing frontmatter. |
| `propose_memory` | Write a fact to `.claude/memory/inbox/` for human review. |

---

## What is gitignored

```
.claude/md-activity.jsonl   ← runtime, per-machine
.claude/md-snapshots/       ← runtime, per-machine
.claude/memory/inbox/       ← review queue (commit curated/ when you like)
```
