"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CONSENT_KEY = "travel_pro_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${CONSENT_KEY}=`));
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const setConsent = (accepted: boolean) => {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${CONSENT_KEY}=${accepted ? "accepted" : "rejected"}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    setVisible(false);

    if (accepted && typeof window !== "undefined" && (window as any).posthog) {
      (window as any).posthog.opt_in_capturing();
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t border-border shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-foreground font-medium mb-1">
            We use cookies to improve your experience.
          </p>
          <p className="text-xs text-muted-foreground">
            Analytics help us understand how you use Travel Pro. We never sell your data.{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setConsent(false)}
            className="btn-ghost text-sm px-4 py-2"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => setConsent(true)}
            className="btn-primary text-sm px-4 py-2"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
