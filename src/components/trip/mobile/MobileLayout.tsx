"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import { MobileHero } from "./MobileHero";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileJourneyTab } from "./MobileJourneyTab";
import { EssentialsTab } from "../plan-view/EssentialsTab";
import { ItinerarySkeletonTab } from "../SkeletonTabs";
import type { MobileTab } from "../types";
import type { TripLayoutProps } from "../types";

export function MobileLayout({
  itinerary,
  tripId,
  tripTitle,
  totalDays,
  countries,
  isAuthenticated,
  isPartialItinerary,
  isGenerating,
  generationError,
  needsRegeneration,
  onRetry,
  onRegenerate,
  onDismissRegeneration,
  visaLoading,
  weatherLoading,
  visaError,
  weatherError,
  generatingCityId,
  onGenerateActivities,
}: TripLayoutProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>("journey");
  const { route } = itinerary;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero section */}
      {!isPartialItinerary && (
        <MobileHero
          route={route}
          totalDays={totalDays}
          countries={countries}
        />
      )}

      {/* Generation banner */}
      {isGenerating && (
        <div className="px-4 py-3 bg-primary/5 border-b border-primary/20">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm text-primary font-medium">Generating your itinerary...</span>
          </div>
        </div>
      )}

      {/* Error banner */}
      {generationError && (
        <div className="px-4 py-3 bg-accent/10 border-b border-accent/30">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-foreground">{generationError}</p>
            <Button size="xs" onClick={onRetry} className="shrink-0">Try again</Button>
          </div>
        </div>
      )}

      {/* Regeneration banner */}
      {needsRegeneration && !isPartialItinerary && !generationError && (
        <div className="px-4 py-3 bg-primary/10 border-b border-primary/30">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-foreground">Route changed. Regenerate?</p>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={onDismissRegeneration} className="text-xs text-muted-foreground">
                Dismiss
              </button>
              <Button size="xs" onClick={onRegenerate} className="gap-1.5">
                <RefreshCw className="w-3 h-3" /> Regenerate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save-trip nudge */}
      {isAuthenticated === false && !isPartialItinerary && !generationError && !needsRegeneration && (
        <div className="px-4 py-2.5 bg-background/95 border-b border-accent/40">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-foreground line-clamp-2">
              Create a free account to save this itinerary.
            </p>
            <Link
              href={`/signup?next=/trip/${tripId}`}
              className="shrink-0 btn-primary text-[10px] py-1 px-3"
            >
              Save trip
            </Link>
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="animate-tab-in">
        {activeTab === "journey" && (
          isPartialItinerary ? (
            <div className="px-4 pt-4">
              <ItinerarySkeletonTab route={route} />
            </div>
          ) : (
            <MobileJourneyTab
              itinerary={itinerary}
              generatingCityId={generatingCityId}
              onGenerateActivities={onGenerateActivities}
            />
          )
        )}
        {activeTab === "prep" && (
          <div className="px-4 py-4 pb-20">
            <EssentialsTab
              itinerary={itinerary}
              visaLoading={visaLoading}
              weatherLoading={weatherLoading}
              visaError={visaError}
              weatherError={weatherError}
            />
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
