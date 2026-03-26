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
  } = useTripContext();

  const showLegacyItinerary = discoveryStatus === "completed" && itinerary.days.length > 0;

  return (
    <TripMobileShell showBanners>
      {showLegacyItinerary ? (
        <MobileJourneyTab itinerary={itinerary} />
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
        />
      )}
    </TripMobileShell>
  );
}
