import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    // Default environment for component tests.
    // Server-side test files override this with @vitest-environment node.
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // Exclude e2e tests — those run under Playwright
    exclude: ["**/node_modules/**", "**/e2e/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});