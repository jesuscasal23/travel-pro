// ============================================================
// Server-initiated Google OAuth
//
// The Supabase JS client stores the PKCE code verifier via its storage
// adapter.  When the flow starts client-side (createBrowserClient),
// the verifier ends up in document.cookie / localStorage — which may
// NOT be shared between a standalone PWA and Chrome on Android.
//
// By starting the flow server-side, the verifier is persisted via
// Set-Cookie headers in the HTTP response, which the browser always
// processes — regardless of PWA vs Chrome context.
// ============================================================
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseSessionEnv } from "@/lib/config/server-env";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const next = searchParams.get("next") ?? "/trips";
  const isPwa = searchParams.get("pwa") === "1";

  const { url, anonKey } = getSupabaseSessionEnv();
  const cookieStore = await cookies();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });

  const origin = request.nextUrl.origin;
  const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", error?.message ?? "Could not start Google sign-in");
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  // Mark PWA context so the callback can show the bridge UI
  if (isPwa) {
    cookieStore.set("travel_pro_pwa_auth", "1", {
      path: "/",
      maxAge: 300,
      httpOnly: true,
      sameSite: "lax",
    });
  }

  return NextResponse.redirect(data.url);
}
