"use client";

import { useState, useEffect } from "react";
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
import type { DesktopTab, DesktopLayoutProps } from "../types";
import type { CityStop } from "@/types";

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

  // Keyboard shortcuts: Ctrl/Cmd+Z = undo, Escape = exit edit mode
  useEffect(() => {
    if (!isEditMode) return;
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      } else if (e.key === "Escape") {
        exitEditMode();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isEditMode, undo, exitEditMode]);

  function handleCityClick(index: number) {
    onCityClick(index);
    setActiveTab("route");
  }

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
      <Navbar isAuthenticated={isAuthenticated ?? false} />

      {/* Edit mode banner (below navbar) */}
      {isEditMode && (
        <div className="pt-16">
          <EditModeBanner />
        </div>
      )}

      {/* Fixed top bar for banners */}
      <div className={isEditMode ? "" : "pt-16"}>
        {/* Generation banner */}
        {!isEditMode && isGenerating && (
          <div className="bg-primary/5 border-b border-primary/20">
            <div className="max-w-240 mx-auto px-4 py-2.5 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="text-sm text-primary font-medium">Generating your itinerary...</span>
            </div>
          </div>
        )}

        {/* Error banner */}
        {!isEditMode && generationError && (
          <div className="bg-accent/10 border-b border-accent/30">
            <div className="max-w-240 mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
              <p className="text-sm text-foreground">{generationError}</p>
              <Button size="xs" onClick={onRetry} className="shrink-0">Try again</Button>
            </div>
          </div>
        )}

        {/* Regeneration banner */}
        {!isEditMode && needsRegeneration && !isPartialItinerary && !generationError && (
          <div className="bg-primary/10 border-b border-primary/30">
            <div className="max-w-240 mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
              <p className="text-sm text-foreground">
                Your route has changed. Regenerate to update activities.
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
        {!isEditMode && isAuthenticated === false && !isPartialItinerary && !generationError && !needsRegeneration && (
          <div className="bg-background/95 backdrop-blur-sm border-b border-accent/40">
            <div className="max-w-240 mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
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
      <DesktopHero
        route={isEditMode && draft ? draft.route : route}
        totalDays={totalDays}
        countries={countries}
        tripId={tripId}
        isPartialItinerary={isPartialItinerary}
        activeCityIndex={activeCityIndex}
        onCityClick={handleCityClick}
        isEditMode={isEditMode}
        onToggleEditMode={isEditMode ? handleDiscard : handleEnterEdit}
        onEditRoute={() => setRouteSheetOpen(true)}
        onShare={handleShareClick}
      />

      {/* Inline route editing panel (desktop) */}
      {isEditMode && isRouteSheetOpen && draft && (
        <EditRouteSheet
          variant="desktop"
          cities={draft.route}
          onCitiesChange={handleRouteCitiesChange}
          onClose={() => setRouteSheetOpen(false)}
        />
      )}

      {/* Tab bar (hidden in edit mode — edit mode shows all cities inline) */}
      {!isEditMode && <DesktopTabBar activeTab={activeTab} onTabChange={setActiveTab} />}

      {/* Tab content */}
      <div className="animate-tab-in">
        {isEditMode && draft ? (
          <div className="max-w-240 mx-auto pb-24">
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
          <>
            {activeTab === "journey" && (
              isPartialItinerary ? (
                <div className="max-w-240 mx-auto px-4 py-6">
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
              <div className="max-w-240 mx-auto px-4 py-6">
                <EssentialsTab
                  itinerary={itinerary}
                  visaLoading={visaLoading}
                  weatherLoading={weatherLoading}
                  visaError={visaError}
                  weatherError={weatherError}
                />
              </div>
            )}
            {activeTab === "route" && (
              <div className="max-w-240 mx-auto px-4 py-6">
                <div className="h-125 rounded-xl overflow-hidden border border-border">
                  <RouteMap
                    cities={route}
                    activeCityIndex={activeCityIndex}
                    onCityClick={handleCityClick}
                  />
                </div>
              </div>
            )}
            {activeTab === "accommodation" && (
              <div className="max-w-240 mx-auto px-4 py-6" />
            )}
            {activeTab === "flights" && (
              <div className="max-w-240 mx-auto px-4 py-6" />
            )}
            {activeTab === "budget" && (
              <div className="max-w-240 mx-auto px-4 py-6">
                <BudgetTab itinerary={itinerary} tripId={tripId} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating edit toolbar (desktop) */}
      {isEditMode && (
        <EditToolbar
          variant="desktop"
          canUndo={undoStack.length > 0}
          hasChanges={undoStack.length > 0}
          onUndo={undo}
          onDiscard={handleDiscard}
          onSave={handleSave}
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
