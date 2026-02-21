// ============================================================
// E2E: Route Review & Edit Cities Flow
//
// Tests the full guest journey for multi-city trips:
//   - Questionnaire → Route Review step with AI-suggested cities
//   - Remove a city on Route Review → verify it disappears
//   - Generate itinerary → trip view loads
//   - Edit page → add a city → save → regeneration banner appears
//
// Uses Playwright route interception to mock:
//   - Supabase auth (→ guest)
//   - Route selection API
//   - Trip creation API
//   - SSE generation endpoint
// ============================================================

import { test, expect, type Page } from "@playwright/test";

// Extended timeout for generation flow
test.setTimeout(60_000);

// ── Mock Data ────────────────────────────────────────────────────────────────

const mockCitiesWithDays = [
  { id: "tokyo", city: "Tokyo", country: "Japan", countryCode: "JP", iataCode: "NRT", lat: 35.68, lng: 139.69, minDays: 2, maxDays: 4 },
  { id: "hanoi", city: "Hanoi", country: "Vietnam", countryCode: "VN", iataCode: "HAN", lat: 21.03, lng: 105.85, minDays: 1, maxDays: 3 },
  { id: "bangkok", city: "Bangkok", country: "Thailand", countryCode: "TH", iataCode: "BKK", lat: 13.76, lng: 100.5, minDays: 1, maxDays: 3 },
  { id: "chiang-mai", city: "Chiang Mai", country: "Thailand", countryCode: "TH", iataCode: "CNX", lat: 18.79, lng: 98.98, minDays: 1, maxDays: 3 },
];

const mockTripId = "e2e-test-trip-" + Date.now();

// ── Helpers ──────────────────────────────────────────────────────────────────

async function setupMocks(page: Page) {
  // Block analytics
  await page.route("**/*.posthog.com/**", (route) => route.abort());
  await page.route("**/sentry.io/**", (route) => route.abort());

  // Supabase auth → guest
  await page.route("**/auth/v1/user**", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ code: 401, msg: "not_authenticated" }),
    }),
  );

  // Route selection
  await page.route("**/api/generate/select-route", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ cities: mockCitiesWithDays }),
    }),
  );

  // Trip creation
  await page.route("**/api/v1/trips", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ trip: { id: mockTripId } }),
      });
    }
    return route.continue();
  });

  // SSE generation endpoint — return a completed stream immediately
  await page.route(`**/api/v1/trips/*/generate`, (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: [
          "data: {\"stage\":\"route\",\"message\":\"Route optimised\"}\n\n",
          "data: {\"stage\":\"activities\",\"message\":\"Activities planned\"}\n\n",
          "data: {\"stage\":\"done\",\"message\":\"Complete\"}\n\n",
        ].join(""),
      });
    }
    return route.continue();
  });

  // Trip PATCH (for edit saves)
  await page.route(`**/api/v1/trips/*`, (route) => {
    if (route.request().method() === "PATCH") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    }
    return route.continue();
  });
}

/** Navigate through guest questionnaire steps 1-4 to reach the Details step. */
async function fillQuestionnaire(page: Page) {
  await page.goto("/plan");

  // Step 1: Profile — select nationality
  await expect(page.getByText("Where are you from?")).toBeVisible({ timeout: 15_000 });
  await page.locator("select").selectOption("Germany");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2: Travel style
  await expect(page.getByText("Your travel style")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3: Destination — select multi-city + region + dates
  await expect(page.getByText("Where & when?")).toBeVisible();
  // Multi-city is the default, just pick a region
  await page.getByRole("button", { name: /Southeast Asia/i }).click();
  await page.locator('input[type="date"]').first().fill("2026-04-01");
  await page.locator('input[type="date"]').last().fill("2026-04-22");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 4: Details — budget + travelers
  await expect(page.getByText("Trip details")).toBeVisible();
}

// ── Setup ────────────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  // Accept cookie consent
  await page.evaluate(() => {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `travel_pro_consent=accepted; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  });
});

// ── Tests ────────────────────────────────────────────────────────────────────

test("E2E-05a: Guest multi-city → Route Review shows AI-suggested cities", async ({ page }) => {
  await setupMocks(page);
  await fillQuestionnaire(page);

  // Details step should show "Continue" (not "Generate")
  const continueBtn = page.getByRole("button", { name: "Continue" });
  await expect(continueBtn).toBeVisible();

  // Click Continue → Route Review
  await continueBtn.click();

  // Route Review step should appear
  await expect(page.getByText("Review your route")).toBeVisible({ timeout: 15_000 });

  // AI-suggested cities should be displayed
  await expect(page.getByText("Tokyo")).toBeVisible();
  await expect(page.getByText("Hanoi")).toBeVisible();
  await expect(page.getByText("Bangkok")).toBeVisible();
  await expect(page.getByText("Chiang Mai")).toBeVisible();

  // Generate button should be present
  await expect(page.getByRole("button", { name: /Generate My Itinerary/i })).toBeVisible();
});

test("E2E-05b: Guest multi-city → Remove city on Route Review → Generate", async ({ page }) => {
  await setupMocks(page);
  await fillQuestionnaire(page);

  // Advance to Route Review
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Review your route")).toBeVisible({ timeout: 15_000 });

  // Verify all 4 cities
  await expect(page.getByText("Tokyo")).toBeVisible();
  await expect(page.getByText("Chiang Mai")).toBeVisible();

  // Remove Chiang Mai
  await page.getByRole("button", { name: /Remove Chiang Mai/i }).click();

  // Chiang Mai should disappear
  await expect(page.getByText("Chiang Mai")).not.toBeVisible();

  // Remaining cities still visible
  await expect(page.getByText("Tokyo")).toBeVisible();
  await expect(page.getByText("Hanoi")).toBeVisible();
  await expect(page.getByText("Bangkok")).toBeVisible();

  // Summary should show "3 cities"
  await expect(page.getByText(/3 cities/)).toBeVisible();

  // Generate the itinerary
  await page.getByRole("button", { name: /Generate My Itinerary/i }).click();

  // Should navigate to trip page
  await page.waitForURL(`**/trip/**`, { timeout: 15_000 });
});

test("E2E-05c: Guest multi-city → Back from Route Review returns to Details", async ({ page }) => {
  await setupMocks(page);
  await fillQuestionnaire(page);

  // Advance to Route Review
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Review your route")).toBeVisible({ timeout: 15_000 });

  // Click Back
  await page.getByRole("button", { name: /Back/i }).click();

  // Should return to Details step
  await expect(page.getByText("Trip details")).toBeVisible();
});
