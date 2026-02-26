// ============================================================
// E2E: Planning Flow — Guest Questionnaire Validation Tests
//
// Tests form validation and navigation in the 4-step plan
// questionnaire for guest (unauthenticated) users:
//   - Continue button disabled until required fields are filled
//   - Back button navigates between steps
//
// The full end-to-end flow (landing → generate → trip view)
// is covered in full-workflow.spec.ts.
//
// Uses Playwright route interception to mock Supabase auth (→ guest)
// and API endpoints (route selection).
// ============================================================

import { test, expect, type Page } from "@playwright/test";

// Minimal mock for speculative route selection
const mockCitiesWithDays = [
  {
    id: "tokyo",
    city: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    iataCode: "NRT",
    lat: 35.68,
    lng: 139.69,
    minDays: 2,
    maxDays: 4,
  },
  {
    id: "hanoi",
    city: "Hanoi",
    country: "Vietnam",
    countryCode: "VN",
    iataCode: "HAN",
    lat: 21.03,
    lng: 105.85,
    minDays: 1,
    maxDays: 3,
  },
];

/** Set up mocks needed for the plan page guest flow. */
async function setupMocks(page: Page) {
  // Block external analytics
  await page.route("**/*.posthog.com/**", (route) => route.abort());
  await page.route("**/sentry.io/**", (route) => route.abort());

  // Supabase auth → 401 so useAuthStatus resolves to false (guest)
  await page.route("**/auth/v1/user**", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ code: 401, msg: "not_authenticated" }),
    })
  );

  // Route selection (multi-city)
  await page.route("**/api/generate/select-route", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ cities: mockCitiesWithDays }),
    })
  );
}

// Clear state + dismiss cookie consent before each test
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() => {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `travel_pro_consent=accepted; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  });
});

// ── E2E-01b: Continue disabled until nationality is selected ──────────────────

test("E2E-01b: Continue disabled on Step 1 until nationality is selected", async ({ page }) => {
  await setupMocks(page);
  await page.goto("/plan");

  // Wait for guest flow Step 1
  await expect(page.getByText("Where are you from?")).toBeVisible({ timeout: 15_000 });

  const continueBtn = page.getByRole("button", { name: "Continue" });

  // Default: no nationality → Continue should be disabled
  // (Zustand store has empty nationality after localStorage.clear())
  await expect(continueBtn).toBeDisabled();

  // Select a nationality → Continue becomes enabled
  await page.locator("select").selectOption("Germany");
  await expect(continueBtn).toBeEnabled();
});

// ── E2E-01c: Continue disabled on destination step until region + dates set ───

test("E2E-01c: Continue disabled on destination step until region and dates are set", async ({
  page,
}) => {
  await setupMocks(page);

  // Pre-populate store so we land directly on Step 3 (destination)
  await page.goto("/plan");
  await page.evaluate(() => {
    const raw = localStorage.getItem("travel-pro-store");
    const store = raw ? JSON.parse(raw) : { state: {}, version: 0 };
    store.state = {
      ...store.state,
      nationality: "Germany",
      homeAirport: "FRA - Frankfurt",
      travelStyle: "comfort",
      interests: ["Culture & History"],
      planStep: 4,
    };
    localStorage.setItem("travel-pro-store", JSON.stringify(store));
  });
  await page.reload();

  await expect(page.getByText("Where & when?")).toBeVisible({ timeout: 15_000 });

  const continueBtn = page.getByRole("button", { name: "Continue" });

  // No region, no dates → disabled
  await expect(continueBtn).toBeDisabled();

  // Select region only → still disabled (no dates)
  await page.getByRole("button", { name: /Southeast Asia/i }).click();
  await expect(continueBtn).toBeDisabled();

  // Fill only start date → still disabled
  await page.locator('input[type="date"]').first().fill("2026-04-01");
  await expect(continueBtn).toBeDisabled();

  // Fill end date → enabled
  await page.locator('input[type="date"]').last().fill("2026-04-07");
  await expect(continueBtn).toBeEnabled();
});

// ── E2E-01d: Back button navigates between steps ─────────────────────────────

test("E2E-01d: Back button navigates between steps", async ({ page }) => {
  await setupMocks(page);
  await page.goto("/plan");

  // Step 1: Profile
  await expect(page.getByText("Where are you from?")).toBeVisible({ timeout: 15_000 });
  await page.locator("select").selectOption("Germany");
  await page.getByPlaceholder(/Search airport or city/i).fill("FRA");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2: Travel style
  await expect(page.getByText("Your travel style")).toBeVisible();

  // Click Back → returns to Step 1
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByText("Where are you from?")).toBeVisible();

  // Go forward again
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Your travel style")).toBeVisible();
});
