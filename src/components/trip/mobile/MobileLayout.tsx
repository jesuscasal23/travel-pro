"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import { MobileHero } from "./MobileHero";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileJourneyTab } from "./MobileJourneyTab";
import { EssentialsTab } from "../plan-view/EssentialsTab";
import { BudgetTab } from "../plan-view/BudgetTab";
import { ItinerarySkeletonTab } from "../SkeletonTabs";
import { EditModeBanner } from "../edit/EditModeBanner";
import { EditToolbar } from "../edit/EditToolbar";
import { EditRouteSheet } from "../edit/EditRouteSheet";
import { EditModeJourneyContent } from "../edit/EditModeJourneyContent";
import { ShareModal } from "../ShareModal";
import { useEditStore } from "@/stores/useEditStore";
import { useTripStore } from "@/stores/useTripStore";
import { useShareTrip } from "@/hooks/api";
import { recalculateTravelDays } from "@/lib/utils/recalculate-travel-days";
import type { MobileTab } from "../types";
import type { TripLayoutProps } from "../types";
import type { CityStop } from "@/types";

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
  const [activeDayMap, setActiveDayMap] = useState<Record<number, number>>({});
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const { route } = itinerary;

  const shareMutation = useShareTrip();

  const {
    isEditMode,
    draft,
    undoStack,
    isRouteSheetOpen,
    enterEditMode,
    exitEditMode,
    saveAndExit,
    updateDraft,
    undo,
    setRouteSheetOpen,
  } = useEditStore();

  const setItinerary = useTripStore((s) => s.setItinerary);
  const setNeedsRegeneration = useTripStore((s) => s.setNeedsRegeneration);

  function handleEnterEdit() {
    enterEditMode(itinerary);
    setActiveTab("journey");
  }

  function handleDiscard() {
    exitEditMode();
  }

  function handleSave() {
    if (!draft) return;
    saveAndExit((saved) => {
      const routeChanged =
        JSON.stringify(saved.route.map((c) => ({ id: c.id, days: c.days }))) !==
        JSON.stringify(itinerary.route.map((c) => ({ id: c.id, days: c.days })));

      const citiesAddedOrRemoved =
        saved.route.length !== itinerary.route.length ||
        saved.route.some((c, i) => c.id !== itinerary.route[i]?.id);

      let finalItinerary = saved;
      if (routeChanged) {
        finalItinerary = {
          ...saved,
          days: recalculateTravelDays(saved.days, saved.route),
        };
      }

      setItinerary(finalItinerary);

      if (citiesAddedOrRemoved) {
        setNeedsRegeneration(true);
      }

      if (isAuthenticated && tripId !== "guest") {
        fetch(`/api/v1/trips/${tripId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itinerary: finalItinerary }),
        }).catch(() => {/* best-effort */});
      }
    });
  }

  function handleRouteCitiesChange(cities: CityStop[]) {
    updateDraft((d) => ({ ...d, route: cities }));
  }

  async function handleShareClick() {
    setShareModalOpen(true);

    if (tripId === "guest" || isAuthenticated === false) {
      setShareUrl(`${window.location.origin}/trip/${tripId}`);
      return;
    }

    if (shareUrl) return;

    try {
      const data = await shareMutation.mutateAsync(tripId);
      if (data.shareToken) {
        setShareUrl(`${window.location.origin}/share/${data.shareToken}`);
      }
    } catch {
      // Keep modal open — user can close and retry
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Edit mode banner */}
      {isEditMode && <EditModeBanner />}

      {/* Hero section */}
      <MobileHero
        route={isEditMode && draft ? draft.route : route}
        totalDays={totalDays}
        countries={countries}
        isEditMode={isEditMode}
        onToggleEditMode={isEditMode ? handleDiscard : handleEnterEdit}
        isPartialItinerary={isPartialItinerary}
        onShare={handleShareClick}
      />

      {/* Edit route button */}
      {isEditMode && draft && (
        <div className="px-4 py-2 border-b border-border">
          <button
            onClick={() => setRouteSheetOpen(true)}
            className="btn-ghost text-sm w-full py-2"
          >
            ✏️ Edit Route
          </button>
        </div>
      )}

      {/* Generation banner */}
      {!isEditMode && isGenerating && (
        <div className="px-4 py-3 bg-primary/5 border-b border-primary/20">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm text-primary font-medium">Generating your itinerary...</span>
          </div>
        </div>
      )}

      {/* Error banner */}
      {!isEditMode && generationError && (
        <div className="px-4 py-3 bg-accent/10 border-b border-accent/30">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-foreground">{generationError}</p>
            <Button size="xs" onClick={onRetry} className="shrink-0">Try again</Button>
          </div>
        </div>
      )}

      {/* Regeneration banner */}
      {!isEditMode && needsRegeneration && !isPartialItinerary && !generationError && (
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
      {!isEditMode && isAuthenticated === false && !isPartialItinerary && !generationError && !needsRegeneration && (
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
          ) : isEditMode && draft ? (
            <div className="pb-20">
              <EditModeJourneyContent
                draft={draft}
                activeDayMap={activeDayMap}
                onDayChange={(groupIdx, dayNum) =>
                  setActiveDayMap((prev) => ({ ...prev, [groupIdx]: dayNum }))
                }
                generatingCityId={generatingCityId}
                onGenerateActivities={onGenerateActivities}
              />
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
        {activeTab === "accommodation" && (
          <div className="px-4 py-4 pb-20" />
        )}
        {activeTab === "flights" && (
          <div className="px-4 py-4 pb-20" />
        )}
        {activeTab === "budget" && (
          <div className="px-4 py-4 pb-20">
            <BudgetTab itinerary={itinerary} tripId={tripId} />
          </div>
        )}
      </div>

      {/* Bottom nav OR edit toolbar */}
      {isEditMode ? (
        <EditToolbar
          variant="mobile"
          canUndo={undoStack.length > 0}
          hasChanges={undoStack.length > 0}
          onUndo={undo}
          onDiscard={handleDiscard}
          onSave={handleSave}
        />
      ) : (
        <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {/* Route editing bottom sheet */}
      {isEditMode && isRouteSheetOpen && draft && (
        <EditRouteSheet
          variant="mobile"
          cities={draft.route}
          onCitiesChange={handleRouteCitiesChange}
          onClose={() => setRouteSheetOpen(false)}
        />
      )}

      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        shareUrl={shareUrl}
        isLoading={shareMutation.isPending}
        tripTitle={tripTitle}
      />
    </div>
  );
}
