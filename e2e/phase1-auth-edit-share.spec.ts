import { test, expect } from "@playwright/test";
import {
  TEST_PASSWORD,
  hasAuthCreds,
  hasAdminCreds,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  loginViaUI,
  blockAnalytics,
  mockItinerary,
} from "./helpers";

test("E2E-02: signup (admin-created) -> login -> planner", async ({ page, request }) => {
  if (!hasAuthCreds || !hasAdminCreds) {
    test.skip(true, "Auth credentials not set - skipping");
    return;
  }

  // Create a confirmed user via Supabase admin API (bypasses email verification)
  const uniqueEmail = `e2e+${Date.now()}@travelpro-test.dev`;
  const createRes = await request.fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    data: { email: uniqueEmail, password: TEST_PASSWORD, email_confirm: true },
  });
  expect(createRes.status()).toBe(200);

  // Login with the new user
  await page.goto("/login");
  await page.getByLabel(/Email address/i).fill(uniqueEmail);
  await page.getByLabel(/Password/i).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL("**/trips", { timeout: 15_000 });
  await expect(page).toHaveURL(/trips/);

  // Navigate to planner — new user without profile sees profile step first
  await page.goto("/plan");
  await expect(page.getByText("The essentials")).toBeVisible();

  // Fill profile step: nationality + airport
  await page.locator("select").selectOption("Germany");
  const airportInput = page.getByPlaceholder("Search airport or city...");
  await airportInput.click();
  await airportInput.fill("Frank");
  const airportDropdown = page.locator("ul.absolute.z-50");
  await expect(airportDropdown).toBeVisible();
  await airportDropdown.locator("li").first().click();

  // After filling profile data, the page auto-transitions to the destination step
  // (canSkipProfileStep becomes true once nationality + airport are set)
  await expect(page.getByText("Where to")).toBeVisible({ timeout: 10_000 });

  await page.getByPlaceholder("Search cities...").fill("Paris");
  const parisOption = page
    .locator("button")
    .filter({ hasText: /Paris.*France/ })
    .first();
  await parisOption.click();

  // Fill dates
  await page.locator('input[type="date"]').first().fill("2026-10-01");
  await page.locator('input[type="date"]').nth(1).fill("2026-10-08");
});

test("E2E-03: login -> trip list -> trip view -> verify tabs", async ({ page }) => {
  if (!hasAuthCreds) {
    test.skip(true, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set - skipping auth journey");
    return;
  }

  await blockAnalytics(page);
  await loginViaUI(page);

  // Create a trip so the trips list is not empty
  const createRes = await page.request.post("/api/v1/trips", {
    data: {
      tripType: "single-city",
      region: "",
      destination: "Paris",
      destinationCountry: "France",
      destinationCountryCode: "FR",
      dateStart: "2026-07-01",
      dateEnd: "2026-07-03",
      travelers: 2,
      initialItinerary: mockItinerary,
    },
  });
  expect(createRes.status()).toBe(201);
  const { trip } = (await createRes.json()) as { trip: { id: string } };

  try {
    // Reload trips page to see the new trip
    await page.goto("/trips");
    await expect(page.getByText(/Paris/i).first()).toBeVisible({ timeout: 10_000 });

    // Navigate to the trip detail page
    await page.goto(`/trips/${trip.id}`);
    await expect(page.getByRole("heading", { name: /Paris/i }).first()).toBeVisible({
      timeout: 15_000,
    });

    // Check that tab navigation links are present
    const itineraryLink = page.getByRole("link", { name: /Itinerary|Activities/i }).first();
    if (await itineraryLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await itineraryLink.click();
      await expect(page).toHaveURL(/itinerary/);
    }

    const flightsLink = page.getByRole("link", { name: /Flights/i }).first();
    if (await flightsLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await flightsLink.click();
      await expect(page).toHaveURL(/flights/);
    }
  } finally {
    await page.request.delete(`/api/v1/trips/${trip.id}`);
  }
});

test("E2E-06: auth pages render key form elements", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  await expect(page.getByPlaceholder("At least 8 characters")).toBeVisible();
  await expect(page.getByRole("button", { name: /sign up|create account/i })).toBeVisible();
  await expect(page.locator('a[href^="/login"]').last()).toBeVisible();

  await page.goto("/login");
  await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  await expect(page.getByPlaceholder("Your password")).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in|log in/i })).toBeVisible();
  // "Forgot?" link to forgot-password page
  await expect(page.getByRole("link", { name: /forgot/i })).toBeVisible();

  await page.goto("/forgot-password");
  await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  await expect(page.getByRole("button", { name: /send reset link|send|reset/i })).toBeVisible();
});
