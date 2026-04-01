"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTripContext } from "@/components/trip/TripContext";
import { TripMobileShell } from "@/components/trip/mobile/TripMobileShell";
import { VisaSection } from "@/components/trip/VisaSection";

export default function TripOverviewPage() {
  const { tripId, itinerary, isPartialItinerary, totalDays } = useTripContext();

  const nextSteps = [
    !itinerary ? { label: "Generate your itinerary", href: `/trip/${tripId}` } : null,
    itinerary && !itinerary.flightLegs?.length
      ? { label: "Review flight options", href: `/trips/${tripId}/flights` }
      : null,
    itinerary && !(itinerary.accommodationData?.length ?? 0)
      ? { label: "Compare accommodation options", href: `/trips/${tripId}/hotels` }
      : null,
    totalDays > 0
      ? { label: `Plan activities for ${totalDays} days`, href: `/trips/${tripId}/itinerary` }
      : null,
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <TripMobileShell showHero showBanners>
      {!isPartialItinerary && nextSteps.length > 0 ? (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-brand-primary text-[11px] font-bold tracking-[0.18em] uppercase">
                Next Steps
              </p>
              <h2 className="text-ink mt-1 text-[1.4rem] font-bold tracking-[-0.04em]">
                Keep moving
              </h2>
            </div>
            <span className="text-label text-[11px] font-bold tracking-[0.18em] uppercase">
              {nextSteps.length} pending
            </span>
          </div>

          <div className="space-y-3">
            {nextSteps.map((step) => (
              <Link
                key={step.label}
                href={step.href}
                className="shadow-glass-md flex items-center gap-3 rounded-[24px] border border-white/80 bg-white/88 px-4 py-4"
              >
                <div className="text-brand-primary bg-brand-primary-soft flex h-11 w-11 items-center justify-center rounded-2xl">
                  <ChevronRight className="h-4 w-4" />
                </div>
                <p className="text-heading flex-1 text-[15px] font-semibold tracking-[-0.02em]">
                  {step.label}
                </p>
                <ChevronRight className="text-icon-muted h-4 w-4" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <VisaSection />
    </TripMobileShell>
  );
}
