import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/test/integration/setup.ts"],
    include: ["src/test/integration/**/*.integration.test.ts"],
    // Sequential execution — tests share one database
    maxWorkers: 1,
    minWorkers: 1,
    // Generous timeouts for DB operations + first-run migrations
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
