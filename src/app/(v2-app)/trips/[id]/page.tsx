"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTripContext } from "@/components/trip/TripContext";
import { TripMobileShell } from "@/components/trip/mobile/TripMobileShell";

export default function TripOverviewPage() {
  const { tripId, itinerary, isPartialItinerary, totalDays } = useTripContext();

  const nextSteps = [
    !itinerary.flightLegs?.length ? "Review flight options" : null,
    !(itinerary.accommodationData?.length ?? 0) ? "Compare accommodation options" : null,
    totalDays > 0 ? `Plan activities for ${totalDays} days` : null,
  ].filter(Boolean) as string[];

  return (
    <TripMobileShell showHero showBanners>
      {!isPartialItinerary && nextSteps.length > 0 ? (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-brand-primary text-[11px] font-bold tracking-[0.18em] uppercase">
                Next Steps
              </p>
              <h2 className="mt-1 text-[1.4rem] font-bold tracking-[-0.04em] text-[#101114]">
                Keep moving
              </h2>
            </div>
            <span className="text-[11px] font-bold tracking-[0.18em] text-[#8ea0bb] uppercase">
              {nextSteps.length} pending
            </span>
          </div>

          <div className="space-y-3">
            {nextSteps.map((step) => (
              <Link
                key={step}
                href={`/trips/${tripId}/bookings`}
                className="flex items-center gap-3 rounded-[24px] border border-white/80 bg-white/88 px-4 py-4 shadow-[0_16px_30px_rgba(27,43,75,0.05)]"
              >
                <div className="text-brand-primary bg-brand-primary-soft flex h-11 w-11 items-center justify-center rounded-2xl">
                  <ChevronRight className="h-4 w-4" />
                </div>
                <p className="flex-1 text-[15px] font-semibold tracking-[-0.02em] text-[#17181c]">
                  {step}
                </p>
                <ChevronRight className="h-4 w-4 text-[#a3adbc]" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </TripMobileShell>
  );
}
