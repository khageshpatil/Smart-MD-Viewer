# T02 — Bundle Code Splitting (Vite Manual Chunks)

**Priority:** P0  
**Estimated time:** 4 hours  
**Depends on:** T01 must be complete  
**Must complete before:** T03

---

## Context

Current initial bundle: 1,918 kB minified / 602 kB gzip.
Target: 300 kB gzip initial load.

The biggest offenders (after T01 cleanup):
- Mermaid library: ~400 kB gzip (only needed when diagrams exist)
- Prism syntax highlighter: ~150 kB gzip (only needed when code blocks exist)  
- Ticket/GitHub route: substantial, only needed at /tickets
- MermaidSandbox: large dialog, only opened on demand

MarkdownPreview.tsx already uses React.lazy() — correct.
MermaidSandbox already uses React.lazy() in Index.tsx — correct.
But the chunks aren't configured to split properly.

---

## Step 1 — Update vite.config.ts

Replace the entire content of ite.config.ts with:

`	ypescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/Smart-MD-Viewer/' : '/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Mermaid gets its own chunk — lazy loaded
          if (id.includes('node_modules/mermaid') || id.includes('node_modules/d3') || id.includes('node_modules/dagre')) {
            return 'mermaid';
          }
          // Syntax highlighting gets its own chunk — lazy loaded
          if (id.includes('node_modules/react-syntax-highlighter') || id.includes('node_modules/prismjs') || id.includes('node_modules/highlight.js') || id.includes('node_modules/refractor')) {
            return 'syntax-highlight';
          }
          // Ticket/GitHub route gets its own chunk
          if (id.includes('src/pages/Tickets') || id.includes('src/components/TicketBoard') || id.includes('src/components/TicketCard') || id.includes('src/components/TicketColumn') || id.includes('src/components/TicketModal') || id.includes('src/components/GitHubConnect') || id.includes('src/components/GitHubPRPanel') || id.includes('src/hooks/useTickets') || id.includes('src/hooks/useGitHub') || id.includes('src/lib/github')) {
            return 'tickets';
          }
          // MermaidSandbox gets its own chunk
          if (id.includes('src/components/MermaidSandbox')) {
            return 'mermaid-sandbox';
          }
          // Radix UI primitives as a vendor chunk
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix';
          }
          // React + React DOM as a stable vendor chunk
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          // Other node_modules as a general vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    // Warn when any single chunk exceeds 300 kB
    chunkSizeWarningLimit: 300,
  },
}));
`

---

## Step 2 — Verify App.tsx lazy-loads Tickets

Open src/App.tsx. Confirm this pattern exists (it should already):

`	sx
const Tickets = lazy(() => import("./pages/Tickets"));
`

If it's NOT lazy (i.e., import Tickets from "./pages/Tickets" is a static import), change it to the lazy version.

---

## Step 3 — Verify MarkdownPreview is lazy in Index.tsx

Open src/pages/Index.tsx. Confirm these lazy imports exist at the top:

`	sx
const MermaidSandbox = lazy(() => import("@/components/MermaidSandbox")...);
const MarkdownPreview = lazy(() => import("@/components/MarkdownPreview")...);
`

These should already be there. Do NOT remove them or change them.

---

## Step 4 — Verify MermaidDiagram is lazy in MarkdownPreview.tsx

Open src/components/MarkdownPreview.tsx. Confirm this pattern at the top:

`	sx
const MermaidDiagram = lazy(() => import("@/components/MermaidDiagram"));
const SyntaxHighlighter = lazy(async () => { ... });
`

These should already be there. Do NOT change them.

---

## Step 5 — Run build and check output

`
npm run build
`

The build output should show multiple chunks instead of one massive bundle.
Expected output pattern:
`
dist/assets/react-vendor-[hash].js     ~140 kB
dist/assets/radix-[hash].js            ~80 kB
dist/assets/vendor-[hash].js           ~50 kB
dist/assets/mermaid-[hash].js          ~400 kB  (not in initial load)
dist/assets/syntax-highlight-[hash].js ~150 kB  (not in initial load)
dist/assets/tickets-[hash].js          ~XX kB   (not in initial load)
dist/assets/index-[hash].js            ~100 kB  (initial bundle — MUCH smaller)
`

The index-[hash].js (initial bundle) should be under 300 kB.

If Vite still warns about chunk sizes, check which chunk is large and add it to manualChunks.

---

## Step 6 — Update MASTER.md

1. Change T02 status to [x]
2. Update "Bundle size" in Current State Snapshot with the new index chunk size
3. Update "Last completed task" to "T02"

---

## Acceptance Criteria

- [ ] 
pm run build completes without errors
- [ ] Multiple named chunks appear in dist/assets/
- [ ] Initial JS chunk (index-[hash].js) is under 300 kB
- [ ] Mermaid is in its own chunk (mermaid-[hash].js)
- [ ] Syntax highlighting is in its own chunk (syntax-highlight-[hash].js)
- [ ] Tickets page still loads correctly at /tickets
- [ ] Mermaid diagrams still render in preview
- [ ] Syntax highlighting still works in code blocks

---

## DO NOT TOUCH

- src/lib/secureShare.ts
- src/lib/indexedDB.ts
- src/pages/Index.tsx
- src/index.css
- index.html
- 	ailwind.config.ts
- Any component files (this task is vite.config.ts ONLY + minor lazy import verification)
