// ============================================================
// E2E: TRA-78 — Flight & hotel selection + shopping cart flow
//
// E2E-78-01: Flight selection — select, change, remove
// E2E-78-02: Hotel selection — select, view others, remove
// E2E-78-03: Manual selection fallback (Skyscanner)
// E2E-78-04: Cart page — view, mark booked, remove
// E2E-78-05: Cart manual selections show "Search again"
// E2E-78-06: BottomNav badge count
// E2E-78-07: Auth enforcement — /cart redirects to login
// ============================================================

import { test, expect, type Page } from "@playwright/test";
import { hasAuthCreds, loginViaUI, blockAnalytics, mockItinerary } from "./helpers";

// ── Mock data ──

const mockFlightResults = {
  results: [
    {
      price: 245,
      duration: "2h 30m",
      airline: "AF",
      stops: 0,
      departureTime: "2026-07-01T08:00:00",
      arrivalTime: "2026-07-01T10:30:00",
      cabin: "ECONOMY",
      bookingToken: "mock-token-1",
      bookingUrl: "https://www.skyscanner.net/mock-1",
    },
    {
      price: 189,
      duration: "3h 15m",
      airline: "DL",
      stops: 1,
      departureTime: "2026-07-01T14:00:00",
      arrivalTime: "2026-07-01T17:15:00",
      cabin: "ECONOMY",
      bookingToken: "mock-token-2",
      bookingUrl: "https://www.skyscanner.net/mock-2",
    },
  ],
  fetchedAt: Date.now(),
};

const mockAccommodationData = [
  {
    city: "Paris",
    countryCode: "FR",
    checkIn: "2026-07-01",
    checkOut: "2026-07-03",
    hotels: [
      {
        hotelId: "hotel-1",
        name: "Hotel Le Marais",
        rating: 4,
        pricePerNight: 120,
        totalPrice: 240,
        why: "Central location",
        distance: "0.5 km from center",
        bookingUrl: "https://booking.com/hotel-1",
        imageUrl: null,
        overallRating: 4.2,
        reviewCount: 350,
        address: "1 Rue de Rivoli",
      },
      {
        hotelId: "hotel-2",
        name: "Grand Paris Hotel",
        rating: 5,
        pricePerNight: 280,
        totalPrice: 560,
        why: "Luxury experience",
        distance: "0.2 km from center",
        bookingUrl: "https://booking.com/hotel-2",
        imageUrl: null,
        overallRating: 4.8,
        reviewCount: 120,
        address: "10 Avenue des Champs",
      },
    ],
    fallbackSearchUrl: "https://booking.com/search?ss=Paris",
  },
];

const mockFlightSelectionBody = {
  selectionType: "platform" as const,
  fromIata: "JFK",
  toIata: "CDG",
  departureDate: "2026-07-01",
  direction: "outbound" as const,
  airline: "AF",
  price: 245,
  duration: "2h 30m",
  stops: 0,
  departureTime: "2026-07-01T08:00:00",
  arrivalTime: "2026-07-01T10:30:00",
  cabin: "ECONOMY",
  bookingToken: "mock-token-1",
  bookingUrl: "https://www.skyscanner.net/mock-1",
};

const mockHotelSelectionBody = {
  selectionType: "platform" as const,
  city: "Paris",
  countryCode: "FR",
  checkIn: "2026-07-01",
  checkOut: "2026-07-03",
  hotelName: "Hotel Le Marais",
  hotelId: "hotel-1",
  rating: 4,
  pricePerNight: 120,
  totalPrice: 240,
  currency: "EUR",
  bookingUrl: "https://booking.com/hotel-1",
};

// ── Helpers ──

/** Mock flight search and accommodation enrichment APIs */
async function mockExternalApis(page: Page) {
  await page.route("**/api/v1/trips/*/flights", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockFlightResults),
      });
    } else {
      await route.fallback();
    }
  });

  await page.route("**/api/v1/enrich/accommodation**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockAccommodationData),
    });
  });
}

/** Block external booking sites from loading */
async function blockExternalSites(page: Page) {
  await page.route("**skyscanner.net**", (route) => route.abort());
  await page.route("**booking.com**", (route) => route.abort());
}

// ============================================================
// E2E-78-07: Auth enforcement (no auth required)
// ============================================================

test("E2E-78-07: /cart redirects unauthenticated users to /login", async ({ page }) => {
  await blockAnalytics(page);
  await page.goto("/cart");
  await expect(page).toHaveURL(/\/login\?next=%2Fcart/, { timeout: 10_000 });
});

// ============================================================
// Authenticated tests
// ============================================================

test.describe("Selection & Cart flow (authenticated)", () => {
  let tripId: string;

  test.beforeEach(async ({ page }) => {
    if (!hasAuthCreds) return;

    await blockAnalytics(page);
    await loginViaUI(page);

    // Ensure profile exists
    await page.request.patch("/api/v1/profile", {
      data: {
        nationality: "American",
        homeAirport: "JFK",
        travelStyle: "smart-budget",
        interests: ["culture"],
      },
    });

    // Create a trip with itinerary
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
    tripId = trip.id;
  });

  test.afterEach(async ({ page }) => {
    if (!hasAuthCreds || !tripId) return;
    await page.request.delete(`/api/v1/trips/${tripId}`).catch(() => {});
  });

  // ============================================================
  // E2E-78-01: Flight selection
  // ============================================================

  test("E2E-78-01: flight selection — select, change, remove", async ({ page }) => {
    if (!hasAuthCreds) {
      test.skip(true, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — skipping");
      return;
    }

    await mockExternalApis(page);
    await blockExternalSites(page);

    await page.goto(`/trips/${tripId}/flights`);

    // Wait for flight results to load (mocked)
    await expect(page.getByText("Flight Options")).toBeVisible({ timeout: 15_000 });

    // Wait for at least one "Select" button to appear (flight results rendered)
    const selectButtons = page.getByRole("button", { name: "Select" });
    await expect(selectButtons.first()).toBeVisible({ timeout: 15_000 });

    // Click "Select" on the first flight
    await selectButtons.first().click();

    // Verify "Selected" badge appears
    await expect(page.getByText("Selected").first()).toBeVisible({ timeout: 5_000 });

    // Verify the compact card shows the route
    await expect(page.getByText("Change").first()).toBeVisible();

    // Click "Change" to show results again
    await page.getByText("Change").first().click();

    // Verify results list reappears — another "Select" button should be visible
    await expect(selectButtons.first()).toBeVisible({ timeout: 5_000 });

    // Click "Remove" to clear selection
    const removeButton = page.getByText("Remove").first();
    await removeButton.click();

    // Verify "Selected" badge is gone
    await expect(page.getByText("Selected")).not.toBeVisible({ timeout: 5_000 });
  });

  // ============================================================
  // E2E-78-02: Hotel selection
  // ============================================================

  test("E2E-78-02: hotel selection — select, view others, remove", async ({ page }) => {
    if (!hasAuthCreds) {
      test.skip(true, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — skipping");
      return;
    }

    await mockExternalApis(page);
    await blockExternalSites(page);

    await page.goto(`/trips/${tripId}/hotels`);

    // Wait for accommodation section to load
    await expect(page.getByText("Accommodation")).toBeVisible({ timeout: 15_000 });

    // Wait for hotel cards to render
    await expect(page.getByText("Hotel Le Marais")).toBeVisible({ timeout: 15_000 });

    // Click "Select" on the first hotel
    const selectButtons = page.getByRole("button", { name: /Select/ });
    await selectButtons.first().click();

    // Verify "Selected" badge appears
    await expect(page.getByText("Selected").first()).toBeVisible({ timeout: 5_000 });

    // Verify "View other options" toggle appears
    const viewOthers = page.getByText(/View \d+ other option/);
    await expect(viewOthers).toBeVisible({ timeout: 5_000 });

    // Click to expand other options
    await viewOthers.click();

    // The other hotel should now be visible
    await expect(page.getByText("Grand Paris Hotel")).toBeVisible({ timeout: 5_000 });

    // Click "Remove" to clear selection
    await page.getByText("Remove").first().click();

    // Verify "Selected" badge is gone
    await expect(page.getByText("Selected")).not.toBeVisible({ timeout: 5_000 });
  });

  // ============================================================
  // E2E-78-03: Manual selection fallback
  // ============================================================

  test("E2E-78-03: manual selection — Skyscanner fallback creates manual selection", async ({
    page,
  }) => {
    if (!hasAuthCreds) {
      test.skip(true, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — skipping");
      return;
    }

    // Mock flights to return empty results so the fallback CTA shows
    await page.route("**/api/v1/trips/*/flights", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ results: [], fetchedAt: Date.now() }),
        });
      } else {
        await route.fallback();
      }
    });
    await blockExternalSites(page);

    await page.goto(`/trips/${tripId}/flights`);
    await expect(page.getByText("Flight Options")).toBeVisible({ timeout: 15_000 });

    // Wait for empty state to render — "Search on Skyscanner" CTA
    const skyscannerLink = page.getByText("Search on Skyscanner").first();
    await expect(skyscannerLink).toBeVisible({ timeout: 15_000 });

    // Click the fallback link — this triggers onSelectManual which creates a manual selection
    await skyscannerLink.click();

    // Verify a manual selection was created by checking the flight selections API
    const selectionsRes = await page.request.get(`/api/v1/trips/${tripId}/selections/flights`);
    expect(selectionsRes.status()).toBe(200);
    const { selections } = (await selectionsRes.json()) as {
      selections: Array<{ selectionType: string }>;
    };
    expect(selections.some((s) => s.selectionType === "manual")).toBe(true);
  });

  // ============================================================
  // E2E-78-04: Cart page — view, mark booked, remove
  // ============================================================

  test("E2E-78-04: cart page — view selections, mark booked, remove", async ({ page }) => {
    if (!hasAuthCreds) {
      test.skip(true, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — skipping");
      return;
    }

    await blockExternalSites(page);

    // Create flight selection via API
    const flightRes = await page.request.put(`/api/v1/trips/${tripId}/selections/flights`, {
      data: mockFlightSelectionBody,
    });
    expect(flightRes.status()).toBe(200);
    // Create hotel selection via API
    const hotelRes = await page.request.put(`/api/v1/trips/${tripId}/selections/hotels`, {
      data: mockHotelSelectionBody,
    });
    expect(hotelRes.status()).toBe(200);

    // Navigate to cart
    await page.goto("/cart");

    // Verify trip group shows with destination
    await expect(page.getByText("Paris")).toBeVisible({ timeout: 15_000 });

    // Verify flight item shows route
    await expect(page.getByText("JFK")).toBeVisible();
    await expect(page.getByText("CDG")).toBeVisible();

    // Verify hotel item shows hotel name
    await expect(page.getByText("Hotel Le Marais")).toBeVisible();

    // Verify "Book Now" button exists for platform selections
    await expect(page.getByText("Book Now").first()).toBeVisible();

    // Click "Mark booked" on the flight
    const markBookedButtons = page.getByText("Mark booked");
    await markBookedButtons.first().click();

    // Wait for the flight to disappear from cart (it was booked)
    await expect(page.getByText("JFK").first()).not.toBeVisible({ timeout: 5_000 });

    // Hotel should still be visible
    await expect(page.getByText("Hotel Le Marais")).toBeVisible();

    // Click "Remove" on the hotel
    await page.getByText("Remove").first().click();

    // Verify hotel is removed — cart should now be empty
    await expect(page.getByText("Your cart is empty")).toBeVisible({ timeout: 5_000 });
  });

  // ============================================================
  // E2E-78-05: Cart manual selections show "Search again"
  // ============================================================

  test("E2E-78-05: cart manual selections show 'Search again' instead of 'Book Now'", async ({
    page,
  }) => {
    if (!hasAuthCreds) {
      test.skip(true, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — skipping");
      return;
    }

    await blockExternalSites(page);

    // Create a manual flight selection
    const manualFlightRes = await page.request.put(`/api/v1/trips/${tripId}/selections/flights`, {
      data: {
        ...mockFlightSelectionBody,
        selectionType: "manual",
        airline: "Skyscanner",
        price: 0,
        duration: "",
        stops: 0,
        departureTime: null,
        arrivalTime: null,
        bookingToken: null,
      },
    });
    expect(manualFlightRes.status()).toBe(200);

    await page.goto("/cart");
    await expect(page.getByText("Paris")).toBeVisible({ timeout: 15_000 });

    // Manual selections should show "Search again" instead of "Book Now"
    await expect(page.getByText("Search again")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("Book Now")).not.toBeVisible();
  });

  // ============================================================
  // E2E-78-06: BottomNav badge count
  // ============================================================

  test("E2E-78-06: BottomNav badge shows correct unbooked count", async ({ page }) => {
    if (!hasAuthCreds) {
      test.skip(true, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — skipping");
      return;
    }

    // Create flight + hotel selections via API
    const flightRes = await page.request.put(`/api/v1/trips/${tripId}/selections/flights`, {
      data: mockFlightSelectionBody,
    });
    expect(flightRes.status()).toBe(200);

    const hotelRes = await page.request.put(`/api/v1/trips/${tripId}/selections/hotels`, {
      data: mockHotelSelectionBody,
    });
    expect(hotelRes.status()).toBe(200);
    const { selection: hotelSelection } = (await hotelRes.json()) as {
      selection: { id: string };
    };

    // Navigate to trips page to see the BottomNav
    await page.goto("/trips");
    await expect(page.getByText("Cart")).toBeVisible({ timeout: 10_000 });

    // Verify badge shows "2"
    const cartLink = page.locator("a[href='/cart']");
    await expect(cartLink.locator("span").filter({ hasText: "2" })).toBeVisible({ timeout: 5_000 });

    // Mark the hotel as booked via API
    await page.request.patch(`/api/v1/trips/${tripId}/selections/hotels`, {
      data: { id: hotelSelection.id },
    });

    // Reload to get fresh count
    await page.reload();
    await expect(page.getByText("Cart")).toBeVisible({ timeout: 10_000 });

    // Badge should now show "1"
    await expect(cartLink.locator("span").filter({ hasText: "1" })).toBeVisible({ timeout: 5_000 });
  });
});
