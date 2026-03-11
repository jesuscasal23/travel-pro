"use client";

import { AccommodationTab } from "@/components/trip/plan-view/AccommodationTab";
import { FlightsTab } from "@/components/trip/plan-view/FlightsTab";
import { TripMobileShell } from "@/components/trip/mobile/TripMobileShell";
import { useTripContext } from "@/components/trip/TripContext";

export default function TripBookingsPage() {
  const { itinerary, tripId } = useTripContext();

  return (
    <TripMobileShell showBanners>
      <div className="space-y-8 py-1">
        <section>
          <p className="text-brand-primary text-[11px] font-bold tracking-[0.18em] uppercase">
            Flights
          </p>
          <div className="mt-3">
            <FlightsTab itinerary={itinerary} tripId={tripId} />
          </div>
        </section>

        <section>
          <p className="text-brand-primary text-[11px] font-bold tracking-[0.18em] uppercase">
            Stays
          </p>
          <div className="mt-3">
            <AccommodationTab itinerary={itinerary} tripId={tripId} />
          </div>
        </section>
      </div>
    </TripMobileShell>
  );
}
