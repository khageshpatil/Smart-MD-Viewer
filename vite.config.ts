import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Set base to repository name for GitHub Pages
  // For custom domain or root deployment, set base: '/'
  // Use repository name in production, root in development
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
}));
