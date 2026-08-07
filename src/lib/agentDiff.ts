// src/lib/agentDiff.ts
// Simple iterative LCS-based line diff utility. Zero external dependencies.

export type DiffType = "equal" | "insert" | "delete";

export interface DiffLine {
  type: DiffType;
  content: string;
}

export interface SideBySideLine {
  left: { content: string; type: DiffType };
  right: { content: string; type: DiffType };
}

/** Compute an LCS-based line diff between two strings. */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before === "" ? [] : before.split("\n");
  const b = after === "" ? [] : after.split("\n");

  // For very large files, skip LCS and just show full replace
  if (a.length + b.length > 3000) {
    return [
      ...a.map((content) => ({ type: "delete" as DiffType, content })),
      ...b.map((content) => ({ type: "insert" as DiffType, content })),
    ];
  }

  // Build LCS table iteratively
  const m = a.length;
  const n = b.length;
  const dp: Uint32Array[] = Array.from({ length: m + 1 }, () => new Uint32Array(n + 1));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff (iterative to avoid stack overflow)
  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.push({ type: "equal", content: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: "insert", content: b[j - 1] });
      j--;
    } else {
      result.push({ type: "delete", content: a[i - 1] });
      i--;
    }
  }

  return result.reverse();
}

/** Count added and removed lines from a diff. */
export function countChanges(diff: DiffLine[]): { added: number; removed: number } {
  return {
    added: diff.filter((l) => l.type === "insert").length,
    removed: diff.filter((l) => l.type === "delete").length,
  };
}

/**
 * Convert a flat diff into side-by-side paired lines.
 * Delete-lines appear on the left with an empty right placeholder.
 * Insert-lines appear on the right with an empty left placeholder.
 */
export function toSideBySide(diff: DiffLine[]): SideBySideLine[] {
  const result: SideBySideLine[] = [];

  // Group consecutive deletes and inserts to pair them up
  let i = 0;
  while (i < diff.length) {
    const line = diff[i];

    if (line.type === "equal") {
      result.push({
        left: { content: line.content, type: "equal" },
        right: { content: line.content, type: "equal" },
      });
      i++;
    } else if (line.type === "delete") {
      // Collect consecutive deletes
      const deletes: string[] = [];
      while (i < diff.length && diff[i].type === "delete") {
        deletes.push(diff[i].content);
        i++;
      }
      // Collect consecutive inserts that follow
      const inserts: string[] = [];
      while (i < diff.length && diff[i].type === "insert") {
        inserts.push(diff[i].content);
        i++;
      }

      const maxLen = Math.max(deletes.length, inserts.length);
      for (let k = 0; k < maxLen; k++) {
        result.push({
          left: {
            content: k < deletes.length ? deletes[k] : "",
            type: k < deletes.length ? "delete" : "equal",
          },
          right: {
            content: k < inserts.length ? inserts[k] : "",
            type: k < inserts.length ? "insert" : "equal",
          },
        });
      }
    } else {
      // standalone insert (no preceding delete)
      result.push({
        left: { content: "", type: "equal" },
        right: { content: line.content, type: "insert" },
      });
      i++;
    }
  }

  return result;
}

/** Rebuild before-content from diff (all non-insert lines). */
export function beforeContent(diff: DiffLine[]): string {
  return diff
    .filter((l) => l.type !== "insert")
    .map((l) => l.content)
    .join("\n");
}

/** Rebuild after-content from diff (all non-delete lines). */
export function afterContent(diff: DiffLine[]): string {
  return diff
    .filter((l) => l.type !== "delete")
    .map((l) => l.content)
    .join("\n");
}
