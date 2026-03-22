"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/core/supabase-client";

/**
 * Auth callback — handles OAuth code exchange client-side.
 *
 * Why client-side?  When a standalone PWA on Android navigates to Google
 * OAuth, Chrome takes over. The PKCE code verifier was stored in the
 * browser's cookies by the Supabase SDK. A server-side route handler would
 * need that cookie in the request — but on some Android devices the cookie
 * set in the PWA isn't available to Chrome's request in time. By exchanging
 * the code client-side, the Supabase browser client reads the verifier
 * directly from document.cookie in the same browser context, which always
 * works.
 */
function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/trips";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/trips";

  const [status, setStatus] = useState<"loading" | "pwa-done" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function exchangeCode() {
      if (!code) {
        // No code — possibly a direct visit or email confirmation deep link.
        // Just redirect to the target page.
        router.replace(next);
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        setErrorMsg("Auth service unavailable.");
        setStatus("error");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        setErrorMsg(error.message);
        setStatus("error");
        return;
      }

      // Check if this OAuth flow was started from the standalone PWA
      const isPwa = document.cookie.includes("travel_pro_pwa_auth=1");

      if (isPwa) {
        // Clear the one-time flag
        document.cookie = "travel_pro_pwa_auth=; path=/; max-age=0";
        setStatus("pwa-done");
      } else {
        // Normal browser — redirect to destination
        router.replace(next);
      }
    }

    void exchangeCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "error") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[image:var(--gradient-page)] px-6">
        <div className="w-full max-w-[360px] text-center">
          <h1 className="text-ink text-xl font-bold">Sign in failed</h1>
          <p className="text-dim mt-3 text-sm">{errorMsg}</p>
          <a
            href={`/login?next=${encodeURIComponent(next)}`}
            className="bg-brand-primary shadow-brand-xl mt-6 inline-block rounded-2xl px-8 py-3.5 text-sm font-semibold text-white"
          >
            Back to login
          </a>
        </div>
      </div>
    );
  }

  if (status === "pwa-done") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[image:var(--gradient-page)] px-6">
        <div className="w-full max-w-[360px] text-center">
          <div className="bg-app-green/12 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
            <CheckCircle2 className="text-app-green h-10 w-10" />
          </div>
          <h1 className="text-ink text-2xl font-bold tracking-tight">You&apos;re signed in!</h1>
          <p className="text-dim mt-3 text-sm leading-relaxed">
            Your session is ready. Switch back to the Travel Pro app to continue &mdash; just tap
            the back button or find it in your recent apps.
          </p>
          <div className="bg-surface-soft mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm">
            <ArrowLeft className="text-dim h-4 w-4" />
            <span className="text-dim">Swipe back or press Back</span>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[image:var(--gradient-page)]">
      <Loader2 className="text-brand-primary h-8 w-8 animate-spin" />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[image:var(--gradient-page)]">
          <Loader2 className="text-brand-primary h-8 w-8 animate-spin" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
