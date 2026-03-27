"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/core/supabase-client";

const GIS_SCRIPT_URL = "https://accounts.google.com/gsi/client";

type GoogleOneTapButtonProps = {
  next: string;
  disabled?: boolean;
  onError?: (message: string | null) => void;
};

async function generateNonce(): Promise<{ raw: string; hashed: string }> {
  const raw = crypto.randomUUID();
  const encoded = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { raw, hashed };
}

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Google Identity Services"))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

export function GoogleOneTapButton({ next, disabled = false, onError }: GoogleOneTapButtonProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const nonceRef = useRef<string>("");

  const handleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      setIsAuthenticating(true);
      onError?.(null);

      const supabase = createClient();
      if (!supabase) {
        onError?.("Auth service unavailable.");
        setIsAuthenticating(false);
        return;
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
        nonce: nonceRef.current,
      });

      if (error) {
        onError?.(error.message);
        setIsAuthenticating(false);
        return;
      }

      router.push(next);
    },
    [next, onError, router]
  );

  useEffect(() => {
    if (disabled) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        const { raw, hashed } = await generateNonce();
        if (cancelled) return;
        nonceRef.current = raw;

        await loadGisScript();
        if (cancelled || !window.google?.accounts?.id || !buttonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: clientId!,
          callback: handleCredential,
          nonce: hashed,
          itp_support: true,
          use_fedcm_for_prompt: true,
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: buttonRef.current.offsetWidth,
        });
      } catch {
        onError?.("Could not load Google sign-in. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [disabled, handleCredential, onError]);

  if (isAuthenticating) {
    return (
      <div className="text-navy flex w-full items-center justify-center gap-3 rounded-[18px] border border-neutral-200 bg-white px-4 py-3.5 text-sm font-semibold">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Signing in...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {isLoading && (
        <div className="text-navy flex w-full items-center justify-center gap-3 rounded-[18px] border border-neutral-200 bg-white px-4 py-3.5 text-sm font-semibold">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading Google sign-in...</span>
        </div>
      )}
      <div
        ref={buttonRef}
        className={isLoading ? "invisible absolute" : "w-full [&>div]:!w-full"}
      />
    </div>
  );
}
