import { test, expect } from "@playwright/test";

// Persistent non-premium test user — created once via Supabase admin API,
// lives in the database indefinitely. No teardown needed.
const PAYWALL_TEST_EMAIL = "e2e-premium-paywall@travelpro-test.dev";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const hasAdminCreds =
  TEST_PASSWORD !== "" &&
  SUPABASE_URL !== "" &&
  SUPABASE_ANON_KEY !== "" &&
  SUPABASE_SERVICE_ROLE_KEY !== "";

/**
 * Ensure the persistent paywall test user exists in Supabase.
 * Supabase admin API returns 200 for new users and 422 if the email
 * already exists — both are fine.
 */
async function ensureUser(request: import("@playwright/test").APIRequestContext) {
  const res = await request.fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    data: { email: PAYWALL_TEST_EMAIL, password: TEST_PASSWORD, email_confirm: true },
  });
  // 200 = created, 422 = already exists — both acceptable
  expect([200, 422]).toContain(res.status());
}

test.describe("Premium paywall gate", () => {
  test.beforeAll(async ({ request }) => {
    if (!hasAdminCreds) return;
    await ensureUser(request);
  });

  test("non-premium user is redirected to /premium on protected routes", async ({ page }) => {
    if (!hasAdminCreds) {
      test.skip(true, "Supabase admin credentials not set - skipping");
      return;
    }

    await page.route("**/*.posthog.com/**", (route) => route.abort());
    await page.route("**/sentry.io/**", (route) => route.abort());

    // Log in with the persistent non-premium user
    await page.goto("/login");
    await page.getByLabel(/Email address/i).fill(PAYWALL_TEST_EMAIL);
    await page.getByLabel(/Password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    // User may already have a profile from a previous run — handle either case
    await page.waitForURL(/\/(trips|premium)/, { timeout: 15_000 });

    // Ensure profile exists so the proxy's premium check activates (is_premium defaults to false)
    await page.request.patch("/api/v1/profile", {
      data: {
        nationality: "German",
        homeAirport: "FRA",
        travelStyle: "smart-budget",
        interests: ["culture"],
      },
    });

    // Navigate to a protected route — should redirect to /premium
    // Use regex to match /premium with or without query params (?source=...)
    await page.goto("/home");
    await page.waitForURL(/\/premium/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/premium/);

    // Verify the paywall page renders
    await expect(page.getByText("Unlock the full experience")).toBeVisible();

    // Attempting to navigate to other protected routes should bounce back to /premium
    for (const route of ["/trips", "/profile"]) {
      await page.goto(route);
      await page.waitForURL(/\/premium/, { timeout: 10_000 });
      await expect(page).toHaveURL(/\/premium/);
    }
  });

  test("non-premium user gets 403 from API endpoints", async ({ page }) => {
    if (!hasAdminCreds) {
      test.skip(true, "Supabase admin credentials not set - skipping");
      return;
    }

    // Log in to get a session
    await page.goto("/login");
    await page.getByLabel(/Email address/i).fill(PAYWALL_TEST_EMAIL);
    await page.getByLabel(/Password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    // User may already have a profile from the previous test — handle either case
    await page.waitForURL(/\/(trips|premium)/, { timeout: 15_000 });

    // Ensure profile exists so the premium check activates (is_premium defaults to false)
    await page.request.patch("/api/v1/profile", {
      data: {
        nationality: "German",
        homeAirport: "FRA",
        travelStyle: "smart-budget",
        interests: ["culture"],
      },
    });

    // API calls with the authenticated (but non-premium) session should return 403
    const tripsRes = await page.request.get("/api/v1/trips");
    expect(tripsRes.status()).toBe(403);

    const body = await tripsRes.json();
    expect(body.error).toBe("Forbidden");
    expect(body.message).toContain("Premium subscription required");
  });
});
