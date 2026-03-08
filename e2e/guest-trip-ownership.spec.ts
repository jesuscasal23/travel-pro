import { test, expect, type BrowserContext, type Page } from "@playwright/test";

async function createGuestTrip(page: Page): Promise<string> {
  const response = await page.request.post("/api/v1/trips", {
    data: {
      tripType: "multi-city",
      region: "europe",
      dateStart: "2026-06-01",
      dateEnd: "2026-06-10",
      travelers: 2,
    },
  });

  const responseText = await response.text();
  expect(response.status(), responseText).toBe(201);
  const json = JSON.parse(responseText) as { trip: { id: string } };
  return json.trip.id;
}

async function destroyGuestTrip(context: BrowserContext, tripId: string): Promise<void> {
  const response = await context.request.delete(`/api/v1/trips/${tripId}`);
  expect(response.status()).toBe(200);
}

test("E2E-GUEST-01: guest owner cookie gates persisted trip access", async ({ browser, page }) => {
  await page.route("**/*.posthog.com/**", (route) => route.abort());
  await page.route("**/sentry.io/**", (route) => route.abort());
  await page.goto("/");

  const tripId = await createGuestTrip(page);
  const ownerCookieName = `travelpro_guest_trip_${tripId}`;

  const ownerCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === ownerCookieName
  );
  expect(ownerCookie).toBeDefined();
  expect(ownerCookie?.httpOnly).toBe(true);

  const ownerGet = await page.request.get(`/api/v1/trips/${tripId}`);
  expect(ownerGet.status()).toBe(200);
  expect(((await ownerGet.json()) as { trip: { id: string } }).trip.id).toBe(tripId);

  const ownerPatch = await page.request.patch(`/api/v1/trips/${tripId}`, {
    data: {
      editType: "reorder_cities",
      editPayload: { from: 0, to: 0 },
    },
  });
  expect(ownerPatch.status()).toBe(404);
  expect(((await ownerPatch.json()) as { error: string }).error).toBe("No active itinerary found");

  const intruder = await browser.newContext({ baseURL: "http://localhost:3000" });
  try {
    const intruderGet = await intruder.request.get(`/api/v1/trips/${tripId}`);
    expect(intruderGet.status()).toBe(403);
    expect(((await intruderGet.json()) as { error: string }).error).toBe("Forbidden");

    const intruderPatch = await intruder.request.patch(`/api/v1/trips/${tripId}`, {
      data: {
        editType: "reorder_cities",
        editPayload: { from: 0, to: 0 },
      },
    });
    expect(intruderPatch.status()).toBe(403);
    expect(((await intruderPatch.json()) as { error: string }).error).toBe("Forbidden");
  } finally {
    await intruder.close();
    await destroyGuestTrip(page.context(), tripId);
  }
});
