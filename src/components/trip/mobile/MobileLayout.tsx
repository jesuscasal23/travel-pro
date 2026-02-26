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
        }).catch(() => {
          /* best-effort */
        });
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
    <div className="bg-background min-h-screen">
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
        <div className="border-border border-b px-4 py-2">
          <button onClick={() => setRouteSheetOpen(true)} className="btn-ghost w-full py-2 text-sm">
            ✏️ Edit Route
          </button>
        </div>
      )}

      {/* Generation banner */}
      {!isEditMode && isGenerating && (
        <div className="bg-primary/5 border-primary/20 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Loader2 className="text-primary h-4 w-4 animate-spin" />
            <span className="text-primary text-sm font-medium">Generating your itinerary...</span>
          </div>
        </div>
      )}

      {/* Error banner */}
      {!isEditMode && generationError && (
        <div className="bg-accent/10 border-accent/30 border-b px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-foreground text-sm">{generationError}</p>
            <Button size="xs" onClick={onRetry} className="shrink-0">
              Try again
            </Button>
          </div>
        </div>
      )}

      {/* Regeneration banner */}
      {!isEditMode && needsRegeneration && !isPartialItinerary && !generationError && (
        <div className="bg-primary/10 border-primary/30 border-b px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-foreground text-sm">Route changed. Regenerate?</p>
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={onDismissRegeneration} className="text-muted-foreground text-xs">
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
      {!isEditMode &&
        isAuthenticated === false &&
        !isPartialItinerary &&
        !generationError &&
        !needsRegeneration && (
          <div className="bg-background/95 border-accent/40 border-b px-4 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-foreground line-clamp-2 text-xs">
                Create a free account to save this itinerary.
              </p>
              <Link
                href={`/signup?next=/trip/${tripId}`}
                className="btn-primary shrink-0 px-3 py-1 text-[10px]"
              >
                Save trip
              </Link>
            </div>
          </div>
        )}

      {/* Tab content */}
      <div className="animate-tab-in">
        {activeTab === "journey" &&
          (isPartialItinerary ? (
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
          ))}
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
        {activeTab === "accommodation" && <div className="px-4 py-4 pb-20" />}
        {activeTab === "flights" && <div className="px-4 py-4 pb-20" />}
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
