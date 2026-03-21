"use client";

import { AccommodationTab } from "@/components/trip/plan-view/AccommodationTab";
import { TripMobileShell } from "@/components/trip/mobile/TripMobileShell";
import { useTripContext } from "@/components/trip/TripContext";

export default function TripHotelsPage() {
  const { itinerary, tripId } = useTripContext();

  return (
    <TripMobileShell showBanners>
      <div className="py-1">
        <section>
          <p className="text-brand-primary text-[11px] font-bold tracking-[0.18em] uppercase">
            Hotels
          </p>
          <div className="mt-3">
            <AccommodationTab itinerary={itinerary} tripId={tripId} />
          </div>
        </section>
      </div>
    </TripMobileShell>
  );
}
