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
    <div className="bg-background min-h-screen">
      <Navbar isAuthenticated={false} />
      <div className="px-4 pt-32 text-center">
        <div className="mb-4 text-4xl">&#x26A0;&#xFE0F;</div>
        <h1 className="text-foreground mb-2 text-xl font-bold">
          Something went wrong loading this trip
        </h1>
        <p className="text-muted-foreground mx-auto mb-8 max-w-md text-sm">
          {process.env.NODE_ENV === "development"
            ? error.message
            : "An unexpected error occurred. Please try again or go back to your dashboard."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="btn-primary px-5 py-2 text-sm">
            Try again
          </button>
          <Link href="/home" className="btn-ghost px-5 py-2 text-sm">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
