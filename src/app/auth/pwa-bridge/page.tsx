"use client";

import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Suspense } from "react";

function BridgeContent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[image:var(--gradient-page)] px-6">
      <div className="w-full max-w-[360px] text-center">
        <div className="bg-app-green/12 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          <CheckCircle2 className="text-app-green h-10 w-10" />
        </div>

        <h1 className="text-ink text-2xl font-bold tracking-tight">You&apos;re signed in!</h1>
        <p className="text-dim mt-3 text-sm leading-relaxed">
          Your session is ready. Switch back to the Travel Pro app to continue &mdash; just tap the
          back button or find it in your recent apps.
        </p>

        <div className="bg-surface-soft mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm">
          <ArrowLeft className="text-dim h-4 w-4" />
          <span className="text-dim">Swipe back or press Back</span>
        </div>
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
