"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { Suspense, useEffect } from "react";

function BridgeContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/trips";

  // Attempt to close this browser tab (works when opened as a popup)
  useEffect(() => {
    window.close();
  }, []);

  // Build the deep link to re-enter the PWA
  const appUrl = typeof window !== "undefined" ? `${window.location.origin}${next}` : next;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[image:var(--gradient-page)] px-6">
      <div className="w-full max-w-[360px] text-center">
        <div className="bg-app-green/12 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          <CheckCircle2 className="text-app-green h-10 w-10" />
        </div>

        <h1 className="text-ink text-2xl font-bold tracking-tight">You&apos;re signed in!</h1>
        <p className="text-dim mt-3 text-sm leading-relaxed">
          Switch back to the Travel Pro app to continue. You can close this browser tab.
        </p>

        <a
          href={appUrl}
          className="bg-brand-primary shadow-brand-xl mt-8 inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Open Travel Pro
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

export default function PwaBridgePage() {
  return (
    <Suspense>
      <BridgeContent />
    </Suspense>
  );
}
