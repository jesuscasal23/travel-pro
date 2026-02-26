import { test, expect, type Page } from "@playwright/test";

const MOCK_TRIP_ID = "e2e-inline-edit-trip";

const mockItinerary = {
  route: [
    {
      id: "tokyo",
      city: "Tokyo",
      country: "Japan",
      countryCode: "JP",
      lat: 35.68,
      lng: 139.69,
      days: 2,
      iataCode: "NRT",
    },
    {
      id: "hanoi",
      city: "Hanoi",
      country: "Vietnam",
      countryCode: "VN",
      lat: 21.03,
      lng: 105.85,
      days: 2,
      iataCode: "HAN",
    },
  ],
  days: [
    {
      day: 1,
      date: "2026-04-01",
      city: "Tokyo",
      activities: [
        {
          name: "Senso-ji Temple",
          category: "culture",
          duration: "2 hours",
          why: "Historic temple district",
        },
      ],
    },
    {
      day: 2,
      date: "2026-04-02",
      city: "Tokyo",
      activities: [
        {
          name: "Shibuya Crossing",
          category: "explore",
          duration: "1 hour",
          why: "Iconic crossing",
        },
      ],
    },
    {
      day: 3,
      date: "2026-04-03",
      city: "Hanoi",
      isTravel: true,
      travelFrom: "Tokyo",
      travelTo: "Hanoi",
      activities: [
        {
          name: "Flight to Hanoi",
          category: "travel",
          duration: "5 hours",
          why: "Transfer day",
        },
      ],
    },
    {
      day: 4,
      date: "2026-04-04",
      city: "Hanoi",
      activities: [
        {
          name: "Old Quarter Walk",
          category: "culture",
          duration: "2 hours",
          why: "Historic streets",
        },
      ],
    },
  ],
};

async function setupGuestTrip(page: Page): Promise<string> {
  await page.route("**/*.posthog.com/**", (route) => route.abort());
  await page.route("**/sentry.io/**", (route) => route.abort());

  await page.route("**/auth/v1/user**", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ code: 401, msg: "not_authenticated" }),
    })
  );

  await page.goto("/");

  await page.evaluate(() => {
    localStorage.clear();
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `travel_pro_consent=accepted; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  });

  await page.evaluate(
    ({ tripId, itinerary }) => {
      const raw = localStorage.getItem("travel-pro-store");
      const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
      parsed.state = {
        ...parsed.state,
        nationality: "Germany",
        homeAirport: "FRA - Frankfurt",
        travelStyle: "comfort",
        interests: ["culture"],
        dateStart: "2026-04-01",
        dateEnd: "2026-04-04",
        currentTripId: tripId,
        itinerary,
        needsRegeneration: false,
      };
      localStorage.setItem("travel-pro-store", JSON.stringify(parsed));
    },
    { tripId: MOCK_TRIP_ID, itinerary: mockItinerary }
  );

  await page.goto(`/trip/${MOCK_TRIP_ID}`);
  await expect(page.getByRole("button", { name: /Edit trip/i }).first()).toBeVisible({
    timeout: 15_000,
  });

  return page.url();
}

async function enterEditMode(page: Page) {
  await page
    .getByRole("button", { name: /Edit trip/i })
    .first()
    .click();
  await expect(page.getByText(/Editing/i)).toBeVisible({ timeout: 5_000 });
}

test("E2E-IE-01: guest - enter edit mode -> verify banner and toolbar", async ({ page }) => {
  await setupGuestTrip(page);
  await enterEditMode(page);

  await expect(page.getByText(/Editing/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Save/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Discard/i }).first()).toBeVisible();
});

test("E2E-IE-02: guest - enter edit mode -> discard -> returns to view mode", async ({ page }) => {
  await setupGuestTrip(page);
  await enterEditMode(page);

  await page
    .getByRole("button", { name: /Discard/i })
    .first()
    .click();

  await expect(page.getByText(/Editing/i)).not.toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole("button", { name: /Edit trip/i }).first()).toBeVisible();
});

test("E2E-IE-03: guest - enter edit mode -> add manual activity -> save", async ({ page }) => {
  await setupGuestTrip(page);
  await enterEditMode(page);

  await page
    .getByRole("button", { name: /Add activity/i })
    .first()
    .click();
  await page.getByText("Add manually").click();

  await expect(page.getByText("Unnamed activity")).toBeVisible({ timeout: 5_000 });

  const nameInput = page.getByPlaceholder("Activity name").first();
  await nameInput.fill("Visit Imperial Palace");
  await nameInput.blur();

  const durationInput = page.getByPlaceholder("e.g. 2 hours").first();
  await durationInput.fill("2 hours");
  await durationInput.blur();

  await page.getByRole("button", { name: /Done/i }).first().click();
  await expect(page.getByText("Visit Imperial Palace")).toBeVisible();

  await page.getByRole("button", { name: /Save/i }).first().click();
  await expect(page.getByText(/Editing/i)).not.toBeVisible({ timeout: 5_000 });
});

test("E2E-IE-04: guest - add activity -> undo -> activity removed", async ({ page }) => {
  await setupGuestTrip(page);
  await enterEditMode(page);

  await page
    .getByRole("button", { name: /Add activity/i })
    .first()
    .click();
  await page.getByText("Add manually").click();

  const nameInput = page.getByPlaceholder("Activity name").first();
  await nameInput.fill("Test Activity XYZ");
  await nameInput.blur();

  await page.getByRole("button", { name: /Done/i }).first().click();
  await expect(page.getByText("Test Activity XYZ")).toBeVisible();

  await page.getByRole("button", { name: /Undo/i }).first().click();
  await expect(page.getByText("Test Activity XYZ")).not.toBeVisible({ timeout: 5_000 });
});

test("E2E-IE-05: /trip/:id/edit redirects to /trip/:id", async ({ page }) => {
  await setupGuestTrip(page);

  await page.goto(`/trip/${MOCK_TRIP_ID}/edit`);
  await page.waitForURL(/\/trip\/[^/]+$/, { timeout: 15_000 });
  expect(page.url()).not.toMatch(/\/edit/);
});

test("E2E-IE-06: guest - enter edit mode -> open route sheet -> city list visible", async ({
  page,
}) => {
  await setupGuestTrip(page);
  await enterEditMode(page);

  await page
    .getByRole("button", { name: /Edit Route/i })
    .first()
    .click();
  await expect(page.getByRole("heading", { name: "Edit Route" })).toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole("button", { name: /Increase days/i }).first()).toBeVisible({
    timeout: 5_000,
  });
});
