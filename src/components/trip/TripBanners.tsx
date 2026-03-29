"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTripContext } from "./TripContext";

interface TripBannersProps {
  variant: "mobile" | "desktop";
}

export function TripBanners({ variant }: TripBannersProps) {
  const {
    isPartialItinerary,
    isBuilding,
    buildError,
    needsRebuild,
    onRetry,
    onRebuild,
    onDismissRebuild,
  } = useTripContext();

  const isMobile = variant === "mobile";
  const wrapperClass = isMobile ? "" : "mx-auto max-w-240";
  const paddingClass = isMobile ? "px-4 py-3" : "px-4 py-2.5";

  return (
    <>
      {/* Build banner */}
      {isBuilding && (
        <div className="border-brand-primary-border bg-brand-primary-subtle border-b">
          <div className={`flex items-center gap-2 ${wrapperClass} ${paddingClass}`}>
            <Loader2 className="text-brand-primary h-4 w-4 animate-spin" />
            <span className="text-brand-primary text-sm font-semibold">
              Building your itinerary...
            </span>
          </div>
        </div>
      )}

      {/* Error banner */}
      {buildError && (
        <div className="border-surface-error-border bg-surface-error-bg border-b">
          <div
            className={`flex items-center justify-between gap-4 ${wrapperClass} ${paddingClass}`}
          >
            <p className="text-surface-error-text text-sm">
              Failed to build itinerary. Please try again.
            </p>
            <Button size="xs" onClick={onRetry} className="shrink-0">
              Try again
            </Button>
          </div>
        </div>
      )}

      {/* Rebuild banner */}
      {needsRebuild && !isPartialItinerary && !buildError && (
        <div className="border-brand-primary-border bg-brand-primary-subtle border-b">
          <div
            className={`flex items-center justify-between gap-3 ${wrapperClass} ${paddingClass}`}
          >
            <p className="text-steel text-sm">
              {isMobile
                ? "Route changed. Rebuild?"
                : "Your route has changed. Rebuild to update activities."}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={onDismissRebuild}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                Dismiss
              </button>
              <Button size="xs" onClick={onRebuild} className="gap-1.5">
                <RefreshCw className="h-3 w-3" /> Rebuild
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
