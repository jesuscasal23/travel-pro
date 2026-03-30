import type { Page } from "@playwright/test";

export const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "";
export const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "";
export const hasAuthCreds = TEST_EMAIL !== "" && TEST_PASSWORD !== "";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const hasAdminCreds =
  SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "" && SUPABASE_SERVICE_ROLE_KEY !== "";

export async function loginViaUI(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/Email address/i).fill(TEST_EMAIL);
  await page.getByLabel(/Password/i).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL("**/trips**", { timeout: 15_000 });
}

export function blockAnalytics(page: Page) {
  return Promise.all([
    page.route("**/*.posthog.com/**", (route) => route.abort()),
    page.route("**/sentry.io/**", (route) => route.abort()),
  ]);
}

export const mockItinerary = {
  route: [
    {
      id: "paris",
      city: "Paris",
      country: "France",
      countryCode: "FR",
      lat: 48.85,
      lng: 2.35,
      days: 3,
      iataCode: "CDG",
    },
  ],
  days: [
    {
      day: 1,
      date: "2026-07-01",
      city: "Paris",
      activities: [
        { name: "Eiffel Tower", category: "culture", duration: "2 hours", why: "Iconic landmark" },
      ],
    },
    {
      day: 2,
      date: "2026-07-02",
      city: "Paris",
      activities: [
        { name: "Louvre Museum", category: "culture", duration: "3 hours", why: "World-class art" },
      ],
    },
    {
      day: 3,
      date: "2026-07-03",
      city: "Paris",
      activities: [
        {
          name: "Montmartre Walk",
          category: "explore",
          duration: "2 hours",
          why: "Charming neighborhood",
        },
      ],
    },
  ],
};
