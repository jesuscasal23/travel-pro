"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
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
        <div className="border-b border-[#dbe7ff] bg-[#f6f9ff]">
          <div className={`flex items-center gap-2 ${wrapperClass} ${paddingClass}`}>
            <Loader2 className="h-4 w-4 animate-spin text-[#2563ff]" />
            <span className="text-sm font-semibold text-[#2563ff]">
              Generating your itinerary...
            </span>
          </div>
        </div>
      )}

      {/* Error banner */}
      {generationError && (
        <div className="border-b border-[#ffd8d8] bg-[#fff6f6]">
          <div
            className={`flex items-center justify-between gap-4 ${wrapperClass} ${paddingClass}`}
          >
            <p className="text-sm text-[#7b2d2d]">Generation failed. Please try again.</p>
            <Button size="xs" onClick={onRetry} className="shrink-0">
              Try again
            </Button>
          </div>
        </div>
      )}

      {/* Regeneration banner */}
      {needsRegeneration && !isPartialItinerary && !generationError && (
        <div className="border-b border-[#dbe7ff] bg-[#f6f9ff]">
          <div
            className={`flex items-center justify-between gap-3 ${wrapperClass} ${paddingClass}`}
          >
            <p className="text-sm text-[#243247]">
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
