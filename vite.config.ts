import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  base: "./",
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
