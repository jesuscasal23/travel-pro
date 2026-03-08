"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/v2/ui/Button";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const goHome = () => router.push("/home");

  async function handleOAuth(provider: "google" | "apple") {
    setLoading(provider);
    setError(null);

    const supabase = createClient();
    if (!supabase) {
      setError("Auth service unavailable.");
      setLoading(null);
      return;
    }

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/home")}`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(null);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col px-6">
      {/* Top section */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-50">
          <span className="text-5xl">🎉</span>
        </div>
        <h1 className="text-v2-navy mt-6 text-center text-2xl font-bold">Save your travel plans</h1>
        <p className="text-v2-text-muted mt-2 text-center text-sm">So you never lose your trips</p>
      </div>

      {/* Bottom section */}
      <div className="space-y-3 pb-8">
        {error && <p className="text-v2-red text-center text-sm">{error}</p>}

        <Button variant="outline" onClick={() => handleOAuth("google")} disabled={loading !== null}>
          <span className="flex items-center justify-center gap-2">
            {loading === "google" ? (
              <span className="text-v2-text-muted text-sm">Connecting...</span>
            ) : (
              <>
                <span className="text-lg font-bold">
                  <span className="text-[#4285F4]">G</span>
                  <span className="text-[#EA4335]">o</span>
                  <span className="text-[#FBBC05]">o</span>
                  <span className="text-[#4285F4]">g</span>
                  <span className="text-[#34A853]">l</span>
                  <span className="text-[#EA4335]">e</span>
                </span>
                Continue with Google
              </>
            )}
          </span>
        </Button>

        <Button variant="apple" onClick={() => handleOAuth("apple")} disabled={loading !== null}>
          <span className="flex items-center justify-center gap-2">
            {loading === "apple" ? (
              <span className="text-sm">Connecting...</span>
            ) : (
              <>
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </>
            )}
          </span>
        </Button>

        <Button
          variant="primary"
          onClick={() => router.push(`/signup?next=${encodeURIComponent("/home")}`)}
          disabled={loading !== null}
        >
          SIGN UP WITH EMAIL
        </Button>

        <p
          className="text-v2-text-muted hover:text-v2-navy mt-2 cursor-pointer text-center text-sm"
          onClick={goHome}
        >
          Skip for now
        </p>
      </div>
    </div>
  );
}
