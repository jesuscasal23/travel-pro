"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Loader2, RefreshCw } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui";
import { DesktopHero } from "./DesktopHero";
import { DesktopTabBar } from "./DesktopTabBar";
import { DesktopJourneyTab } from "./DesktopJourneyTab";
import { EssentialsTab } from "../plan-view/EssentialsTab";
import { BudgetTab } from "../plan-view/BudgetTab";
import { ItinerarySkeletonTab, BudgetSkeletonTab } from "../SkeletonTabs";
import type { DesktopTab, DesktopLayoutProps } from "../types";

const RouteMap = dynamic(() => import("@/components/map/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-secondary rounded-xl animate-pulse flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary/10" />
      <div className="h-3 w-28 rounded bg-primary/10" />
    </div>
  ),
});

export function DesktopLayout({
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
  activeCityIndex,
  onCityClick,
  generatingCityId,
  onGenerateActivities,
}: DesktopLayoutProps) {
  const [activeTab, setActiveTab] = useState<DesktopTab>("journey");
  const { route, budget, days } = itinerary;

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={isAuthenticated ?? false} />

      {/* Fixed top bar for banners */}
      <div className="pt-16">
        {/* Generation banner */}
        {isGenerating && (
          <div className="bg-primary/5 border-b border-primary/20">
            <div className="max-w-[960px] mx-auto px-4 py-2.5 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="text-sm text-primary font-medium">Generating your itinerary...</span>
            </div>
          </div>
        )}

        {/* Error banner */}
        {generationError && (
          <div className="bg-accent/10 border-b border-accent/30">
            <div className="max-w-[960px] mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
              <p className="text-sm text-foreground">{generationError}</p>
              <Button size="xs" onClick={onRetry} className="shrink-0">Try again</Button>
            </div>
          </div>
        )}

        {/* Regeneration banner */}
        {needsRegeneration && !isPartialItinerary && !generationError && (
          <div className="bg-primary/10 border-b border-primary/30">
            <div className="max-w-[960px] mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
              <p className="text-sm text-foreground">
                Your route has changed. Regenerate to update activities and budget.
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={onDismissRegeneration} className="text-xs text-muted-foreground hover:text-foreground">
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
          <div className="bg-background/95 backdrop-blur-sm border-b border-accent/40">
            <div className="max-w-[960px] mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
              <p className="text-sm text-foreground">
                Want to keep this itinerary? Create a free account to save it and access it from any device.
              </p>
              <Link
                href={`/signup?next=/trip/${tripId}`}
                className="shrink-0 btn-primary text-xs py-1.5 px-4"
              >
                Save trip
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Hero */}
      {!isPartialItinerary && (
        <DesktopHero
          route={route}
          totalDays={totalDays}
          budget={budget}
          countries={countries}
          tripId={tripId}
          isPartialItinerary={isPartialItinerary}
          activeCityIndex={activeCityIndex}
          onCityClick={onCityClick}
        />
      )}

      {/* Tab bar */}
      <DesktopTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content */}
      <div className="animate-tab-in">
        {activeTab === "journey" && (
          isPartialItinerary ? (
            <div className="max-w-[960px] mx-auto px-4 py-6">
              <ItinerarySkeletonTab route={route} />
            </div>
          ) : (
            <DesktopJourneyTab
              itinerary={itinerary}
              generatingCityId={generatingCityId}
              onGenerateActivities={onGenerateActivities}
            />
          )
        )}
        {activeTab === "prep" && (
          <div className="max-w-[960px] mx-auto px-4 py-6">
            <EssentialsTab
              itinerary={itinerary}
              visaLoading={visaLoading}
              weatherLoading={weatherLoading}
              visaError={visaError}
              weatherError={weatherError}
            />
          </div>
        )}
        {activeTab === "spending" && (
          <div className="max-w-[960px] mx-auto px-4 py-6">
            {isPartialItinerary ? (
              <BudgetSkeletonTab />
            ) : (
              <BudgetTab budget={budget} route={route} days={days} />
            )}
          </div>
        )}
        {activeTab === "route" && (
          <div className="max-w-[960px] mx-auto px-4 py-6">
            <div className="h-[500px] rounded-xl overflow-hidden border border-border">
              <RouteMap
                cities={route}
                activeCityIndex={activeCityIndex}
                onCityClick={onCityClick}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
