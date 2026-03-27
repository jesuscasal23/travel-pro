"use client";

import { FlightsTab } from "@/components/trip/plan-view/FlightsTab";
import { TripMobileShell } from "@/components/trip/mobile/TripMobileShell";
import { useTripContext } from "@/components/trip/TripContext";

export default function TripFlightsPage() {
  const { itinerary, tripId } = useTripContext();

  if (!itinerary) {
    return (
      <TripMobileShell>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="font-display text-foreground text-lg font-bold">No flights yet</p>
          <p className="text-muted-foreground mt-1 max-w-xs text-sm">
            Generate your itinerary to see flight options here.
          </p>
        </div>
      </TripMobileShell>
    );
  }

  return (
    <TripMobileShell showBanners>
      <div className="py-1">
        <FlightsTab itinerary={itinerary} tripId={tripId} />
      </div>
    </TripMobileShell>
  );
}
