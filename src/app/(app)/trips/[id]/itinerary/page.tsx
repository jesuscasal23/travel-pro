"use client";

import { MobileJourneyTab } from "@/components/trip/mobile/MobileJourneyTab";
import { MobileDiscoveryTab } from "@/components/trip/mobile/MobileDiscoveryTab";
import { TripMobileShell } from "@/components/trip/mobile/TripMobileShell";
import { useTripContext } from "@/components/trip/TripContext";

export default function TripItineraryPage() {
  const {
    itinerary,
    discoveryStatus,
    discoveryCards,
    discoveryCursor,
    discoveryTotalTarget,
    discoveryIsLoading,
    discoveryError,
    onDiscoverySwipe,
    discoveryCityIndex,
    discoveryTotalCities,
    discoveryLikedCount,
    discoveryRequiredCount,
    assignedActivities,
  } = useTripContext();

  if (!itinerary) {
    return (
      <TripMobileShell>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="font-display text-foreground text-lg font-bold">No itinerary yet</p>
          <p className="text-muted-foreground mt-1 max-w-xs text-sm">
            Generate your itinerary to see your day-by-day plan here.
          </p>
        </div>
      </TripMobileShell>
    );
  }

  const showJourney =
    discoveryStatus === "completed" && (assignedActivities.length > 0 || itinerary.days.length > 0);

  const currentCityName = itinerary.route[discoveryCityIndex]?.city;

  return (
    <TripMobileShell showBanners>
      {showJourney ? (
        <MobileJourneyTab itinerary={itinerary} assignedActivities={assignedActivities} />
      ) : (
        <MobileDiscoveryTab
          status={discoveryStatus}
          cards={discoveryCards}
          cursor={discoveryCursor}
          totalTarget={discoveryTotalTarget}
          isLoading={discoveryIsLoading}
          error={discoveryError}
          isMultiCity={itinerary.route.length > 1}
          onSwipe={onDiscoverySwipe}
          cityIndex={discoveryCityIndex}
          totalCities={discoveryTotalCities}
          likedCount={discoveryLikedCount}
          requiredCount={discoveryRequiredCount}
          currentCityName={currentCityName}
        />
      )}
    </TripMobileShell>
  );
}
