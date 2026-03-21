"use client";

import { BudgetTab } from "@/components/trip/plan-view/BudgetTab";
import { TripMobileShell } from "@/components/trip/mobile/TripMobileShell";
import { useTripContext } from "@/components/trip/TripContext";

export default function TripBudgetPage() {
  const { itinerary, tripId } = useTripContext();

  return (
    <TripMobileShell showBanners>
      <div className="py-1">
        <BudgetTab itinerary={itinerary} tripId={tripId} />
      </div>
    </TripMobileShell>
  );
}
