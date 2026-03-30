"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";

interface TripErrorStateProps {
  isAuthenticated?: boolean;
  title: string;
  description: string;
  ctaLabel?: string;
  onRetry?: () => void;
}

export function TripErrorState({
  isAuthenticated = true,
  title,
  description,
  ctaLabel = "Try again",
  onRetry,
}: TripErrorStateProps) {
  return (
    <div className="bg-background min-h-screen">
      <Navbar isAuthenticated={isAuthenticated} />
      <div className="pt-32 text-center">
        <p className="text-foreground mb-2 text-xl font-semibold">{title}</p>
        <p className="text-muted-foreground mx-auto mb-6 max-w-md px-4 text-lg">{description}</p>
        <div className="flex items-center justify-center gap-3">
          {onRetry ? (
            <button type="button" className="btn-primary" onClick={onRetry}>
              {ctaLabel}
            </button>
          ) : null}
          <Link
            href="/trips"
            className="inline-block rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-black/5"
          >
            Back to trips
          </Link>
        </div>
      </div>
    </div>
  );
}
