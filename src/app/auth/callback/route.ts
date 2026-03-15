// ============================================================
// Travel Pro — Supabase Auth Callback Handler
// Exchanges auth code for a session after OAuth or email confirmation
// ============================================================
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseSessionEnv } from "@/lib/config/server-env";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next") ?? "/trips";
  // Prevent open redirect — only allow relative paths on the same origin
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/trips";

  if (code) {
    const { url, anonKey } = getSupabaseSessionEnv();
    const cookieStore = await cookies();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    });

    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
