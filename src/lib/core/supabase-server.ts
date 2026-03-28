// ============================================================
// Fichi — Supabase Server Client
// Use in server components and API routes
// ============================================================
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getOptionalSupabaseSessionEnv } from "@/lib/config/server-env";

async function createClient() {
  const cookieStore = await cookies();
  const env = getOptionalSupabaseSessionEnv();
  if (!env) {
    return null;
  }

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — safe to ignore
        }
      },
    },
  });
}

/**
 * Returns the authenticated Supabase user ID from the current request cookies,
 * or null if there is no valid session.
 * Use this in every API route that requires authentication.
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) {
    return null;
  }
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
