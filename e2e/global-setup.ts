/**
 * Playwright global setup — runs once before all tests.
 *
 * Cleans up stale data from previous e2e runs so every suite starts
 * from a known state. Uses Supabase admin API (no browser needed).
 */
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const adminHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

async function cleanupSharedTestUser() {
  if (!TEST_EMAIL || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;

  // Find the shared test user
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

  // Delete all trips for this user (cascade handles selections, itineraries, swipes)
  await fetch(`${SUPABASE_URL}/rest/v1/trips?profile_id=eq.${user.id}`, {
    method: "DELETE",
    headers: adminHeaders,
  });

  // Also clean up any orphaned selections (profileId-based, in case trips were already gone)
  await fetch(`${SUPABASE_URL}/rest/v1/flight_selections?profile_id=eq.${user.id}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
  await fetch(`${SUPABASE_URL}/rest/v1/hotel_selections?profile_id=eq.${user.id}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
}

async function cleanupStaleThrowawayUsers() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;

  const usersRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!usersRes.ok) return;

  const { users } = (await usersRes.json()) as { users: Array<{ id: string; email: string }> };

  // Delete throwaway e2e+ users from previous runs
  const throwaway = users.filter(
    (u) => u.email.startsWith("e2e+") && u.email.endsWith("@travelpro-test.dev")
  );

  for (const user of throwaway) {
    // Delete trips first (cascade)
    await fetch(`${SUPABASE_URL}/rest/v1/trips?profile_id=eq.${user.id}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    // Delete profile
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${user.id}`, {
      method: "DELETE",
      headers: adminHeaders,
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
}

export default async function globalSetup() {
  await cleanupSharedTestUser();
  await cleanupStaleThrowawayUsers();
}
