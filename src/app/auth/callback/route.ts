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
          } catch {
            // Cookie setting can fail in middleware context — non-fatal
          }
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const loginUrl = new URL("/login", requestUrl.origin);
      loginUrl.searchParams.set("error", error.message);
      loginUrl.searchParams.set("next", next);
      return NextResponse.redirect(loginUrl);
    }
  }

  // When OAuth was triggered from the standalone PWA, the callback lands in
  // the system browser. Redirect to a bridge page that tells the user to
  // return to the app (the session cookies are already set on this origin).
  const cookieStore = await cookies();
  const isPwa = cookieStore.get("travel_pro_pwa_auth")?.value === "1";
  if (isPwa) {
    const bridgeUrl = new URL("/auth/pwa-bridge", requestUrl.origin);
    bridgeUrl.searchParams.set("next", next);
    const response = NextResponse.redirect(bridgeUrl);
    // Clear the one-time PWA flag
    response.cookies.set("travel_pro_pwa_auth", "", { path: "/", maxAge: 0 });
    return response;
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
