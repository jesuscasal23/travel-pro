"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { DesktopHero } from "./DesktopHero";
import { DesktopTabBar } from "./DesktopTabBar";
import { DesktopJourneyTab } from "./DesktopJourneyTab";
import { EssentialsTab } from "../plan-view/EssentialsTab";
import { BudgetTab } from "../plan-view/BudgetTab";
import { AccommodationTab } from "../plan-view/AccommodationTab";
import { FlightsTab } from "../plan-view/FlightsTab";
import { ItinerarySkeletonTab } from "../SkeletonTabs";
import { EditModeBanner } from "../edit/EditModeBanner";
import { EditToolbar } from "../edit/EditToolbar";
import { EditRouteSheet } from "../edit/EditRouteSheet";
import { EditModeJourneyContent } from "../edit/EditModeJourneyContent";
import { ShareModal } from "../ShareModal";
import { TripBanners } from "../TripBanners";
import { useTripContext } from "../TripContext";
import { useTripEdit } from "../hooks/useTripEdit";
import { useTripShare } from "../hooks/useTripShare";
import type { DesktopTab, DesktopLayoutProps } from "../types";

const RouteMap = dynamic(() => import("@/components/map/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="bg-secondary flex h-[500px] w-full animate-pulse flex-col items-center justify-center gap-3 rounded-xl">
      <div className="bg-primary/10 h-10 w-10 rounded-full" />
      <div className="bg-primary/10 h-3 w-28 rounded" />
    </div>
  ),
});

export function DesktopLayout({ activeCityIndex, onCityClick }: DesktopLayoutProps) {
  const {
    itinerary,
    tripId,
    tripTitle,
    totalDays,
    countries,
    isAuthenticated,
    isPartialItinerary,
    accommodationLoading,
    accommodationError,
    generatingCityId,
    onGenerateActivities,
  } = useTripContext();

  const [activeTab, setActiveTab] = useState<DesktopTab>("journey");
  const [activeDayMap, setActiveDayMap] = useState<Record<number, number>>({});
  const { route } = itinerary;

  const {
    isEditMode,
    draft,
    undoStack,
    isRouteSheetOpen,
    undo,
    setRouteSheetOpen,
    handleEnterEdit,
    handleDiscard,
    handleSave,
    handleRouteCitiesChange,
  } = useTripEdit(itinerary, tripId, isAuthenticated);

  const { shareModalOpen, setShareModalOpen, shareUrl, handleShareClick, isSharePending } =
    useTripShare(tripId, isAuthenticated);

  // Keyboard shortcuts: Ctrl/Cmd+Z = undo, Escape = exit edit mode
  useEffect(() => {
    if (!isEditMode) return;
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      } else if (e.key === "Escape") {
        handleDiscard();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isEditMode, undo, handleDiscard]);

  function handleCityClick(index: number) {
    onCityClick(index);
    setActiveTab("route");
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar isAuthenticated={isAuthenticated ?? false} />

      {/* Edit mode banner (below navbar) */}
      {isEditMode && (
        <div className="pt-16">
          <EditModeBanner />
        </div>
      )}

      {/* Fixed top bar for banners */}
      <div className={isEditMode ? "" : "pt-16"}>
        {!isEditMode && <TripBanners variant="desktop" />}
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
        onToggleEditMode={
          isEditMode ? handleDiscard : () => handleEnterEdit(() => setActiveTab("journey"))
        }
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
      {!isEditMode && (
        <DesktopTabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          loadingTabs={[...(accommodationLoading ? ["accommodation" as const] : [])]}
          readyTabs={[
            ...(!accommodationLoading &&
            !accommodationError &&
            (itinerary.accommodationData?.length ?? 0) > 0
              ? ["accommodation" as const]
              : []),
            ...((itinerary.flightOptions?.length ?? 0) > 0 ||
            (itinerary.flightLegs?.length ?? 0) > 0
              ? ["flights" as const]
              : []),
          ]}
        />
      )}

      {/* Tab content */}
      <div className="animate-tab-in">
        {isEditMode && draft ? (
          <div className="mx-auto max-w-240 pb-24">
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
            {activeTab === "journey" &&
              (isPartialItinerary ? (
                <div className="mx-auto max-w-240 px-4 py-6">
                  <ItinerarySkeletonTab route={route} />
                </div>
              ) : (
                <DesktopJourneyTab
                  itinerary={itinerary}
                  generatingCityId={generatingCityId}
                  onGenerateActivities={onGenerateActivities}
                />
              ))}
            {activeTab === "prep" && (
              <div className="mx-auto max-w-240 px-4 py-6">
                <EssentialsTab itinerary={itinerary} />
              </div>
            )}
            {activeTab === "route" && (
              <div className="mx-auto max-w-240 px-4 py-6">
                <div className="border-border h-125 overflow-hidden rounded-xl border">
                  <RouteMap
                    cities={route}
                    activeCityIndex={activeCityIndex}
                    onCityClick={handleCityClick}
                  />
                </div>
              </div>
            )}
            {activeTab === "accommodation" && (
              <div className="mx-auto max-w-240 px-4 py-6">
                <AccommodationTab itinerary={itinerary} tripId={tripId} />
              </div>
            )}
            {activeTab === "flights" && (
              <div className="mx-auto max-w-240 px-4 py-6">
                <FlightsTab itinerary={itinerary} tripId={tripId} />
              </div>
            )}
            {activeTab === "budget" && (
              <div className="mx-auto max-w-240 px-4 py-6">
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
        isLoading={isSharePending}
        tripTitle={tripTitle}
      />
    </div>
  );
}
