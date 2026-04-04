// ============================================================
// Fichi — Supabase Browser Client
// Use in client components
// ============================================================
import { createBrowserClient } from "@supabase/ssr";

const globalForSupabase = globalThis as unknown as {
  supabaseBrowserClient: ReturnType<typeof createBrowserClient> | null | undefined;
};

export function createClient() {
  if (globalForSupabase.supabaseBrowserClient !== undefined) {
    return globalForSupabase.supabaseBrowserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    globalForSupabase.supabaseBrowserClient = null;
    return null;
  }

  const client = createBrowserClient(url, key);
  globalForSupabase.supabaseBrowserClient = client;
  return client;
}
