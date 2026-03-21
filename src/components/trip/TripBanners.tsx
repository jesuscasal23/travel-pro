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
        <div className="border-brand-primary-border bg-brand-primary-subtle border-b">
          <div className={`flex items-center gap-2 ${wrapperClass} ${paddingClass}`}>
            <Loader2 className="text-brand-primary h-4 w-4 animate-spin" />
            <span className="text-brand-primary text-sm font-semibold">
              Generating your itinerary...
            </span>
          </div>
        </div>
      )}

      {/* Error banner */}
      {generationError && (
        <div className="border-surface-error-border bg-surface-error-bg border-b">
          <div
            className={`flex items-center justify-between gap-4 ${wrapperClass} ${paddingClass}`}
          >
            <p className="text-surface-error-text text-sm">Generation failed. Please try again.</p>
            <Button size="xs" onClick={onRetry} className="shrink-0">
              Try again
            </Button>
          </div>
        </div>
      )}

      {/* Regeneration banner */}
      {needsRegeneration && !isPartialItinerary && !generationError && (
        <div className="border-brand-primary-border bg-brand-primary-subtle border-b">
          <div
            className={`flex items-center justify-between gap-3 ${wrapperClass} ${paddingClass}`}
          >
            <p className="text-v2-slate text-sm">
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
    </>
  );
}
