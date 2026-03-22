"use client";

import { CheckCircle2 } from "lucide-react";
import { Suspense, useEffect, useState } from "react";

function BridgeContent() {
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    // Try to auto-close this browser tab. This works when the tab was opened
    // via window.open() from the PWA (Chrome allows scripts to close tabs
    // they opened). If it fails, we show a manual "close" message.
    try {
      window.close();
    } catch {
      // ignore
    }
    // If we're still here after a tick, the tab didn't close
    const t = setTimeout(() => setClosed(false), 300);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setClosed(true);
    window.close();
    // Fallback: if close didn't work, reset after a moment
    setTimeout(() => setClosed(false), 500);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[image:var(--gradient-page)] px-6">
      <div className="w-full max-w-[360px] text-center">
        <div className="bg-app-green/12 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          <CheckCircle2 className="text-app-green h-10 w-10" />
        </div>

        <h1 className="text-ink text-2xl font-bold tracking-tight">You&apos;re signed in!</h1>
        <p className="text-dim mt-3 text-sm leading-relaxed">
          You can close this tab and switch back to Travel Pro. Your session is ready.
        </p>

        <button
          type="button"
          onClick={handleClose}
          className="bg-brand-primary shadow-brand-xl mt-8 inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          {closed ? "Closing..." : "Close this tab"}
        </button>
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
