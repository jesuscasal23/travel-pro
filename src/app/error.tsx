"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-5xl mb-6">&#x26A0;&#xFE0F;</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Something went wrong
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          {process.env.NODE_ENV === "development"
            ? error.message
            : "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={reset} className="btn-primary px-6 py-2.5 text-sm">
            Try again
          </button>
          <Link href="/dashboard" className="btn-ghost px-6 py-2.5 text-sm">
            Go to dashboard
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
