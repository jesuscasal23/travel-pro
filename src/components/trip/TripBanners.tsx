"use client";

import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import { useTripContext } from "./TripContext";

interface TripBannersProps {
  variant: "mobile" | "desktop";
}

export function TripBanners({ variant }: TripBannersProps) {
  const {
    tripId,
    isAuthenticated,
    isPartialItinerary,
    isGenerating,
    generationError,
    needsRegeneration,
    onRetry,
    onRegenerate,
    onDismissRegeneration,
  } = useTripContext();

  const isMobile = variant === "mobile";
  const wrapperClass = isMobile ? "" : "mx-auto max-w-240";
  const paddingClass = isMobile ? "px-4 py-3" : "px-4 py-2.5";

  return (
    <>
      {/* Generation banner */}
      {isGenerating && (
        <div className="bg-primary/5 border-primary/20 border-b">
          <div className={`flex items-center gap-2 ${wrapperClass} ${paddingClass}`}>
            <Loader2 className="text-primary h-4 w-4 animate-spin" />
            <span className="text-primary text-sm font-medium">Generating your itinerary...</span>
          </div>
        </div>
      )}

      {/* Error banner */}
      {generationError && (
        <div className="bg-accent/10 border-accent/30 border-b">
          <div
            className={`flex items-center justify-between gap-4 ${wrapperClass} ${paddingClass}`}
          >
            <p className="text-foreground text-sm">{generationError}</p>
            <Button size="xs" onClick={onRetry} className="shrink-0">
              Try again
            </Button>
          </div>
        </div>
      )}

      {/* Regeneration banner */}
      {needsRegeneration && !isPartialItinerary && !generationError && (
        <div className="bg-primary/10 border-primary/30 border-b">
          <div
            className={`flex items-center justify-between gap-3 ${wrapperClass} ${paddingClass}`}
          >
            <p className="text-foreground text-sm">
              {isMobile
                ? "Route changed. Regenerate?"
                : "Your route has changed. Regenerate to update activities."}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={onDismissRegeneration}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                Dismiss
              </button>
              <Button size="xs" onClick={onRegenerate} className="gap-1.5">
                <RefreshCw className="h-3 w-3" /> Regenerate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save-trip nudge */}
      {isAuthenticated === false &&
        !isPartialItinerary &&
        !generationError &&
        !needsRegeneration && (
          <div
            className={`bg-background/95 border-accent/40 border-b ${!isMobile ? "backdrop-blur-sm" : ""}`}
          >
            <div
              className={`flex items-center justify-between gap-3 ${wrapperClass} ${paddingClass}`}
            >
              <p className={`text-foreground ${isMobile ? "line-clamp-2 text-xs" : "text-sm"}`}>
                {isMobile
                  ? "Create a free account to save this itinerary."
                  : "Want to keep this itinerary? Create a free account to save it and access it from any device."}
              </p>
              <Link
                href={`/signup?next=/trip/${tripId}`}
                className={`btn-primary shrink-0 ${isMobile ? "px-3 py-1 text-[10px]" : "px-4 py-1.5 text-xs"}`}
              >
                Save trip
              </Link>
            </div>
          </div>
        )}
    </>
  );
}
