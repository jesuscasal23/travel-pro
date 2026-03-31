import type { Page } from "@playwright/test";

export const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "";
export const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "";
export const hasAuthCreds = TEST_EMAIL !== "" && TEST_PASSWORD !== "";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const hasAdminCreds =
  SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "" && SUPABASE_SERVICE_ROLE_KEY !== "";

const DEFAULT_PROFILE_PATCH = {
  nationality: "American",
  homeAirport: "JFK",
  travelStyle: "smart-budget",
  interests: ["culture"],
} as const;

export async function loginViaUI(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/Email address/i).fill(TEST_EMAIL);
  await page.getByLabel(/Password/i).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL("**/trips**", { timeout: 15_000 });
  await ensurePremiumProfile(page);
}

/**
 * Delete all trips (cascade-deletes selections, itineraries, swipes)
 * and reset the profile to defaults so every spec starts from clean state.
 */
export async function cleanupUserData(page: Page) {
  const tripsRes = await page.request.get("/api/v1/trips");
  if (tripsRes.ok()) {
    const { trips } = (await tripsRes.json()) as { trips: Array<{ id: string }> };
    await Promise.all(
      trips.map((t) => page.request.delete(`/api/v1/trips/${t.id}`).catch(() => {}))
    );
  }
  await page.request.patch("/api/v1/profile", { data: DEFAULT_PROFILE_PATCH });
}

/**
 * Clean up a throwaway Supabase user and all their data.
 * Uses admin API — requires SUPABASE_SERVICE_ROLE_KEY.
 */
export async function cleanupUserByAdmin(email: string) {
  if (!hasAdminCreds) return;

  // Find user ID
  const usersRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!usersRes.ok) return;
  const { users } = (await usersRes.json()) as { users: Array<{ id: string; email: string }> };
  const user = users.find((u) => u.email === email);
  if (!user) return;

  // Delete all trips (cascade cleans selections, itineraries, swipes)
  await fetch(`${SUPABASE_URL}/rest/v1/trips?profile_id=eq.${user.id}`, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: "return=minimal",
    },
  });

  // Delete profile
  await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${user.id}`, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: "return=minimal",
    },
  });

  // Delete auth user
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
}

/**
 * Ensure the logged-in test user has a profile with is_premium = true.
 *
 * The proxy's premium gate blocks ALL /api/v1/* routes when the profile
 * has is_premium = false. To break the chicken-and-egg:
 * 1. Create/update the profile via the app API (proxy fails open if no profile exists)
 * 2. Set is_premium = true directly via Supabase REST (admin bypass)
 */
async function ensurePremiumProfile(page: Page) {
  if (!hasAdminCreds) return;

  // 1. Get the Supabase user ID via admin API
  const usersRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!usersRes.ok) return;
  const { users } = (await usersRes.json()) as { users: Array<{ id: string; email: string }> };
  const user = users.find((u) => u.email === TEST_EMAIL);
  if (!user) return;

  // 2. Set is_premium = true on existing profile (if it exists)
  await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${user.id}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ is_premium: true }),
  });

  // 3. Create profile via app API if it doesn't exist yet.
  //    The proxy fails open when no profile row exists, so this always succeeds
  //    for first-time users. For existing users, the proxy allows (is_premium = true).
  await page.request.patch("/api/v1/profile", { data: DEFAULT_PROFILE_PATCH });

  // 4. If step 3 created a new profile, it defaults to is_premium = false.
  //    Set it back to true.
  await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${user.id}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ is_premium: true }),
  });
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
