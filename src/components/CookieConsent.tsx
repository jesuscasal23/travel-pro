"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CONSENT_KEY = "travel_pro_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = document.cookie.split("; ").find((row) => row.startsWith(`${CONSENT_KEY}=`));
    const shouldShow = !consent;
    if (shouldShow !== visible) {
      setVisible(shouldShow);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setConsent = (accepted: boolean) => {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${CONSENT_KEY}=${accepted ? "accepted" : "rejected"}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    setVisible(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (accepted && typeof window !== "undefined" && (window as any).posthog) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).posthog.opt_in_capturing();
    }
  };

  if (!visible) return null;

  return (
    <div className="bg-background border-border fixed right-0 bottom-0 left-0 z-50 border-t p-4 shadow-lg">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="text-foreground mb-1 text-sm font-medium">
            We use cookies to improve your experience.
          </p>
          <p className="text-muted-foreground text-xs">
            Analytics help us understand how you use Travel Pro. We never sell your data.{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setConsent(false)}
            className="btn-ghost px-4 py-2 text-sm"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => setConsent(true)}
            className="btn-primary px-4 py-2 text-sm"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
