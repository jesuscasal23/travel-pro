"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { Navbar } from "@/components/Navbar";

export default function TripError({
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
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={false} />
      <div className="pt-32 text-center px-4">
        <div className="text-4xl mb-4">&#x26A0;&#xFE0F;</div>
        <h1 className="text-xl font-bold text-foreground mb-2">
          Something went wrong loading this trip
        </h1>
        <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto">
          {process.env.NODE_ENV === "development"
            ? error.message
            : "An unexpected error occurred. Please try again or go back to your dashboard."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="btn-primary px-5 py-2 text-sm">
            Try again
          </button>
          <Link href="/dashboard" className="btn-ghost px-5 py-2 text-sm">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
