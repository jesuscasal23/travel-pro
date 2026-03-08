"use client";

import { useState } from "react";
import { MobileHero } from "./MobileHero";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileJourneyTab } from "./MobileJourneyTab";
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
import type { MobileTab } from "../types";

export function MobileLayout() {
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

  const [activeTab, setActiveTab] = useState<MobileTab>("journey");
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
        onToggleEditMode={
          isEditMode ? handleDiscard : () => handleEnterEdit(() => setActiveTab("journey"))
        }
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

      {/* Generation / error / regen / save-trip banners */}
      {!isEditMode && <TripBanners variant="mobile" />}

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
            <EssentialsTab itinerary={itinerary} />
          </div>
        )}
        {activeTab === "accommodation" && (
          <div className="px-4 py-4 pb-20">
            <AccommodationTab itinerary={itinerary} tripId={tripId} />
          </div>
        )}
        {activeTab === "flights" && (
          <div className="px-4 py-4 pb-20">
            <FlightsTab itinerary={itinerary} tripId={tripId} />
          </div>
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
        <MobileBottomNav
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
        isLoading={isSharePending}
        tripTitle={tripTitle}
      />
    </div>
  );
}
