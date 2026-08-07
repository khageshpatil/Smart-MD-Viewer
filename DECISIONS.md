# Smart MD Viewer — Agent Layer Decisions

**Phase 0 of the Agent Markdown Layer build plan.**
Last updated: 2026-08-06

These answers were locked in before any code was written.
If a decision needs to change, update this file and note why.

---

## 1. Which paths do we care about?

**Watched by default when a repo is connected:**
- `.claude/` — hooks, settings, skills, memory
- `docs/` — project documentation
- `*.md` in the repo root — README, CLAUDE.md, CHANGELOG, etc.

**Always ignored:**
- `node_modules/`, `.git/`, `build/`, `dist/`, `.next/`, `out/`, `.vite/`

The user connects a repo root via `showDirectoryPicker`. The viewer recursively
scans that root for `.md` files matching the above rules.

---

## 2. Read-only or editable?

**Read-only.** The viewer never writes to Markdown files except for one specific
case: the Revert action in Phase 2, which requires an explicit confirmation
dialog before writing.

Rationale: two writers (agent + human) on the same file with no lock protocol
leads to silent data loss. Revisit in Phase 3 at the earliest.

---

## 3. Local only?

**Yes.** No file, content, or metadata ever leaves the user's machine.

The privacy pitch sharpens to: *"an agent-memory tool that never phones home."*

The existing Smart MD Viewer privacy story (`showDirectoryPicker` + IndexedDB,
zero server) is preserved and extended, not compromised.

---

## 4. Which agent first?

**Claude Code only.**

Rationale: it has hooks (deterministic capture) and MCP (agent query), and it's
the agent used daily by the primary developer. Generalise after the shape is
proven.

Cursor, Copilot, and others can be added once the hook abstraction is stable.

---

## 5. Hook script distribution

**Local scripts in the repo.** Hook commands call:
```
node .claude/hooks/notify.js
node .claude/hooks/snapshot.js
```

Both scripts are committed to `.claude/hooks/` and work with no global install.
Promote to a published npm package when Phase 4 (MCP) is shipped and the API
is stable enough to version.

---

## 6. Viewer location for Agent Layer

**New `/agent` route** inside the existing Smart MD Viewer SPA.

Reuses `MarkdownPreview`, `MermaidSandbox`, `TableOfContents`, and theme
system. The agent layer is a page that drives content from the filesystem via
`showDirectoryPicker` instead of IndexedDB.

---

## 7. Directory access persistence

**One-time `showDirectoryPicker`, handle persisted in IndexedDB.**

On page load: retrieve the stored `FileSystemDirectoryHandle`, call
`handle.requestPermission({ mode: 'read' })`. If lapsed, one browser prompt
restores access. User never has to pick the folder again.

For Phase 2 Revert: `requestPermission({ mode: 'readwrite' })` is requested
on demand only when Revert is triggered.

---

## 8. Polling interval

**2 seconds.** Polls `.claude/md-activity.jsonl` every 2s.

Re-renders the open file only when its content hash changes. Scroll position
is preserved across re-renders.

---

## 9. File tree scope

**Full repo `.md` tree always.**

The file tree shows every `.md` file in the connected repo root matching the
path rules above. The activity log is used only to add visual highlights
(glow ring + "last changed" timestamp) to files the agent has touched.

The viewer is useful immediately after connecting a repo, before any Claude
session runs.

---

## 10. Diff view format (Phase 2)

**Side-by-side rendered.**

Left pane: snapshot (pre-agent-edit). Right pane: current file. Both fully
rendered (headings, code blocks, Mermaid). `jsdiff` computes which blocks
changed; changed blocks get a colored left-border highlight.

Uses `react-resizable-panels` (already in the project).

---

## 11. Revert UX (Phase 2)

**Confirmation dialog + `FileSystemWritableFileStream`.**

Dialog shows a summary of what will change ("restoring 14 lines removed,
deleting 2 lines added"). On confirm, writes the snapshot content to the file
directly from the browser. No server needed.

---

## 12. Description collision detection (Phase 3)

**Jaccard similarity on trigrams, threshold 0.4.**

Pure JavaScript, zero dependencies. Splits each skill description into
overlapping 3-character windows, computes intersection/union. Pairs scoring
above 0.4 are flagged as potential collisions.

---

## 13. MCP server registration (Phase 4)

**Global registration via `claude mcp add`.**

```bash
claude mcp add smart-md -- node .claude/hooks/mcp.js
```

Root is inferred from `process.cwd()` at session start. Works across all repos
with zero per-project config.

---

## 14. Memory inbox hard cap (Phase 5)

**50 unreviewed items.**

When the inbox reaches 50, the agent's `propose_memory` MCP tool returns an
error and refuses to write. The fix is to review the queue, not to raise the
cap.
