"use client";

import { FlightsTab } from "@/components/trip/plan-view/FlightsTab";
import { TripMobileShell } from "@/components/trip/mobile/TripMobileShell";
import { useTripContext } from "@/components/trip/TripContext";

export default function TripFlightsPage() {
  const { itinerary, tripId } = useTripContext();

  return (
    <TripMobileShell showBanners>
      <div className="py-1">
        <FlightsTab itinerary={itinerary} tripId={tripId} />
      </div>
    </TripMobileShell>
  );
}
