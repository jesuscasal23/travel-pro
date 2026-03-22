// ============================================================
// Travel Pro — Auth Callback (server-side)
//
// Exchanges the Supabase auth code for a session.  The PKCE code
// verifier was stored via Set-Cookie by /api/auth/google, so it is
// present in the request cookies regardless of PWA ↔ Chrome context.
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

  // Check if this flow was started from the standalone PWA
  const cookieStore = await cookies();
  const isPwa = cookieStore.get("travel_pro_pwa_auth")?.value === "1";

  if (isPwa) {
    // Clear the one-time flag
    const response = NextResponse.redirect(new URL("/auth/pwa-complete", requestUrl.origin));
    response.cookies.set("travel_pro_pwa_auth", "", { path: "/", maxAge: 0 });
    return response;
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
