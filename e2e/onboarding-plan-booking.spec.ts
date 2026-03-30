// ============================================================
// E2E: TRA-26 — Onboarding → trip view → affiliate redirect
//
// E2E-26-01: Full onboarding navigation (get-started → /plan)
// E2E-26-02: Authenticated trip creation and view
// E2E-26-03: Affiliate redirect — 400 for invalid, 302 for valid
// ============================================================

import { test, expect } from "@playwright/test";
import { hasAuthCreds, loginViaUI, blockAnalytics, mockItinerary } from "./helpers";

// ============================================================
// E2E-26-01: Onboarding navigation
// ============================================================

test("E2E-26-01: onboarding — full navigation from get-started to /plan", async ({ page }) => {
  await blockAnalytics(page);

  await page.goto("/");
  await page.evaluate(() => localStorage.clear());

  await page.goto("/get-started");
  await expect(page.getByText(/Your dream trip/i)).toBeVisible();
  await page.getByRole("button", { name: /Start Planning/i }).click();

  await page.waitForURL("**/get-started/advantage**");
  await expect(page.getByText(/The Fichi Advantage/i)).toBeVisible();
  await page.getByRole("button", { name: /Sounds Perfect/i }).click();

  await page.waitForURL("**/get-started/personalization**");
  await expect(page.getByText(/Your travel style/i)).toBeVisible();
  await page.getByRole("button", { name: /Build My Travel DNA/i }).click();

  await page.waitForURL("**/get-started/vibe**");
  await expect(page.getByText(/Tell us about you/i)).toBeVisible();
  await page.getByRole("button", { name: /Continue/i }).click();

  await page.waitForURL("**/get-started/interests**");
  await expect(page.getByText(/What excites you/i)).toBeVisible();
  // Must select at least one interest before Continue is enabled
  await page.getByRole("button", { name: /Food/i }).click();
  await page.getByRole("button", { name: /Continue/i }).click();

  await page.waitForURL("**/get-started/budget**");
  await expect(page.getByText(/Plan your spend/i)).toBeVisible();
  // Must select a budget option before Continue is enabled
  await page.getByRole("button", { name: /Smart Budget/i }).click();
  await page.getByRole("button", { name: /Continue/i }).click();

  await page.waitForURL("**/get-started/rhythm**");
  await expect(page.getByText(/What's your rhythm/i)).toBeVisible();
  // Must select a rhythm option before Continue is enabled
  await page.getByRole("button", { name: /The Wanderer/i }).click();
  await page.getByRole("button", { name: /Continue/i }).click();

  await page.waitForURL("**/plan**");
  await expect(page.getByText(/The essentials/i)).toBeVisible();
});

// ============================================================
// E2E-26-02: Authenticated trip creation and view
// ============================================================

test("E2E-26-02: authenticated — create trip via API and verify trip view renders", async ({
  page,
}) => {
  if (!hasAuthCreds) {
    test.skip(true, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — skipping");
    return;
  }

  await blockAnalytics(page);
  await loginViaUI(page);

  // Ensure the test user has a profile — the trip view enrichment hooks
  // can misbehave (infinite re-render) when the profile endpoint returns 404.
  await page.request.patch("/api/v1/profile", {
    data: {
      nationality: "American",
      homeAirport: "JFK",
      travelStyle: "smart-budget",
      interests: ["culture"],
    },
  });

  // Create a trip with a full itinerary directly via the API.
  // The trip view loads itinerary from the server (React Query → /api/v1/trips/:id),
  // not from localStorage — so we need a real DB record.
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
    // The layout at /trips/[id] enforces auth via requirePageAuth.
    // It then bootstraps TripClientProvider which fetches the itinerary from the server.
    await page.goto(`/trips/${trip.id}`);

    // Trip overview should render the city name (multiple headings may match, use first)
    await expect(page.getByRole("heading", { name: /Paris/i }).first()).toBeVisible({
      timeout: 15_000,
    });

    // Itinerary tab should be reachable.
    // Note: discoveryStatus is "pending" on newly created trips, so the itinerary
    // tab will show the activity discovery UI (not the legacy day-by-day view).
    const itineraryLink = page.getByRole("link", { name: /Itinerary|Activities/i }).first();
    if (await itineraryLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await itineraryLink.click();
      await page.waitForURL(`**/trips/${trip.id}/itinerary**`);
      await expect(page).toHaveURL(/itinerary/);
    }

    // Flights tab should be reachable
    const flightsLink = page.getByRole("link", { name: /Flights/i }).first();
    if (await flightsLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await flightsLink.click();
      await page.waitForURL(`**/trips/${trip.id}/flights**`);
      await expect(page).toHaveURL(/flights/);
    }
  } finally {
    await page.request.delete(`/api/v1/trips/${trip.id}`);
  }
});

// ============================================================
// E2E-26-03: Affiliate redirect
// ============================================================

test("E2E-26-03: affiliate redirect — 400 for invalid request, 302 for valid booking link", async ({
  page,
}) => {
  if (!hasAuthCreds) {
    test.skip(true, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — skipping");
    return;
  }

  await blockAnalytics(page);
  await loginViaUI(page);

  // Missing required fields → 400
  const badRes = await page.request.get("/api/v1/affiliate/redirect?provider=booking", {
    failOnStatusCode: false,
  });
  expect(badRes.status()).toBe(400);

  // Valid booking.com link → server returns 302 → browser follows to booking.com.
  // We intercept the outbound booking.com request so the test never hits the real URL.
  let capturedRedirect = "";
  await page.route("**booking.com**", (route) => {
    capturedRedirect = route.request().url();
    void route.abort();
  });

  const affiliateParams = new URLSearchParams({
    provider: "booking",
    type: "hotel",
    dest: "https://booking.com/hotel/fr/paris-test",
    city: "Paris",
  }).toString();

  // page.goto follows the 302. When the redirect target is intercepted and aborted,
  // navigation throws — that's expected.
  await page
    .goto(`/api/v1/affiliate/redirect?${affiliateParams}`, {
      waitUntil: "commit",
      timeout: 10_000,
    })
    .catch(() => {
      // Expected: navigation aborts once booking.com request is intercepted
    });

  expect(capturedRedirect).toContain("booking.com");
});
