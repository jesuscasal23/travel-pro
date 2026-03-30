import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Load .env.local so NEXT_PUBLIC_* vars are available when Playwright starts the dev server.
// Without this, webServer.env falls back to dummy localhost values which break real auth.
loadEnv({ path: ".env.local" });

export default defineConfig({
  testDir: "./e2e",

  // Each test file gets its own timeout budget.
  // The generation animation alone takes ~18 s, so 60 s per test is safe.
  timeout: 60_000,

  // Assertion timeout (e.g. waitForURL, getByText)
  expect: { timeout: 10_000 },

  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    extraHTTPHeaders: {
      "x-e2e-test": "1",
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    // Re-use a running dev server so tests don't always restart Next.js
    reuseExistingServer: true,
    timeout: 120_000,
    // Provide dummy Supabase env vars so pages using useAuthStatus() don't crash.
    // Actual auth calls are intercepted by Playwright route mocks in each test.
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJ0eXBlIjoiYW5vbiJ9",
    },
  },
});
