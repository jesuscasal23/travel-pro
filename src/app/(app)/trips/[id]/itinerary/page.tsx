"use client";

import { MobileJourneyTab } from "@/components/trip/mobile/MobileJourneyTab";
import { TripMobileShell } from "@/components/trip/mobile/TripMobileShell";
import { useTripContext } from "@/components/trip/TripContext";

export default function TripItineraryPage() {
  const { itinerary, generatingCityId, cityActivityErrors, onGenerateActivities } =
    useTripContext();

  return (
    <TripMobileShell showBanners>
      <MobileJourneyTab
        itinerary={itinerary}
        generatingCityId={generatingCityId}
        cityActivityErrors={cityActivityErrors}
        onGenerateActivities={onGenerateActivities}
      />
    </TripMobileShell>
  );
}
