import path from "node:path";
import { execSync } from "node:child_process";

import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vitest/config";

function getCommitHash(): string {
  try {
    return execSync('git rev-parse --short=7 HEAD')
      .toString()
      .trim();
  } catch {
    return 'dev';
  }
}

// https://vitejs.dev/config/
export default defineConfig(() => ({
  define: {
    'import.meta.env.VITE_COMMIT_HASH': JSON.stringify(getCommitHash()),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    onConsoleLog(log) {
      return !log.includes("React Router Future Flag Warning");
    },
    env: {
      DEBUG_PRINT_LIMIT: '0', // Suppress DOM output that exceeds AI context windows
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));