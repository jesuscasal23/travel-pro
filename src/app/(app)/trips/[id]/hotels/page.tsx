"use client";

import { AccommodationTab } from "@/components/trip/plan-view/AccommodationTab";
import { TripMobileShell } from "@/components/trip/mobile/TripMobileShell";
import { useTripContext } from "@/components/trip/TripContext";

export default function TripHotelsPage() {
  const { itinerary, tripId } = useTripContext();

  if (!itinerary) {
    return (
      <TripMobileShell>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="font-display text-foreground text-lg font-bold">No hotels yet</p>
          <p className="text-muted-foreground mt-1 max-w-xs text-sm">
            Generate your itinerary to see accommodation options here.
          </p>
        </div>
      </TripMobileShell>
    );
  }

  return (
    <TripMobileShell showBanners>
      <div className="py-1">
        <AccommodationTab itinerary={itinerary} tripId={tripId} />
      </div>
    </TripMobileShell>
  );
}
