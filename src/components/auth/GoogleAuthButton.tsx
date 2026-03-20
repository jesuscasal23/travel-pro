"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type GoogleAuthButtonProps = {
  next: string;
  disabled?: boolean;
  onError?: (message: string | null) => void;
};

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M21.805 12.23c0-.72-.065-1.413-.184-2.077H12v3.93h5.498a4.703 4.703 0 0 1-2.04 3.086v2.563h3.294c1.928-1.775 3.053-4.39 3.053-7.502Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.76 0 5.076-.915 6.768-2.468l-3.294-2.563c-.915.613-2.085.977-3.474.977-2.671 0-4.933-1.803-5.74-4.227H2.854v2.644A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.26 13.719A6.01 6.01 0 0 1 5.94 11.999c0-.598.104-1.177.32-1.72V7.635H2.853A10 10 0 0 0 2 12c0 1.614.386 3.142 1.07 4.363l3.19-2.644Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.055c1.5 0 2.847.516 3.908 1.53l2.93-2.93C17.071 3.01 14.755 2 12 2A10 10 0 0 0 3.07 7.635L6.26 10.28c.807-2.425 3.069-4.226 5.74-4.226Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleAuthButton({ next, disabled = false, onError }: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    onError?.(null);

    const supabase = createClient();
    if (!supabase) {
      onError?.("Auth service unavailable.");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      onError?.(error.message);
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className="text-v2-navy flex w-full items-center justify-center gap-3 rounded-[18px] border border-[#d7e3ff] bg-[#f8fbff] px-4 py-3.5 text-sm font-semibold shadow-[0_12px_24px_rgba(27,43,75,0.04)] transition hover:border-[#bfd2ff] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
      <span>{isLoading ? "Redirecting to Google..." : "Continue with Google"}</span>
    </button>
  );
}
