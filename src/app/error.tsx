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
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 text-5xl">&#x26A0;&#xFE0F;</div>
        <h1 className="text-foreground mb-2 text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          {process.env.NODE_ENV === "development"
            ? error.message
            : "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button onClick={reset} className="btn-primary px-6 py-2.5 text-sm">
            Try again
          </button>
          <Link href="/trips" className="btn-ghost px-6 py-2.5 text-sm">
            Go to trips
          </Link>
        </div>
        {error.digest && (
          <p className="text-muted-foreground mt-6 text-xs">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
