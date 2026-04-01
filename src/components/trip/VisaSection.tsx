"use client";

import { ExternalLink } from "lucide-react";
import { AlertBox } from "@/components/ui/AlertBox";
import { useTripContext } from "@/components/trip/TripContext";
import { useTravelerPreferences } from "@/hooks/api/profile/useTravelerPreferences";
import { NATIONALITY_TO_ISO2 } from "@/data/nationality-to-iso2";
import { shouldHideVisaSection, needsSchengenWarning } from "@/lib/utils/visa-utils";
import type { VisaInfo } from "@/types";

function requirementBadgeClass(requirement: VisaInfo["requirement"]): string {
  switch (requirement) {
    case "visa-free":
    case "eta":
      return "text-green-700 bg-green-50 border-green-200";
    case "visa-on-arrival":
    case "e-visa":
      return "text-amber-700 bg-amber-50 border-amber-200";
    case "visa-required":
      return "text-orange-700 bg-orange-50 border-orange-200";
    case "no-admission":
      return "text-red-700 bg-red-50 border-red-200";
  }
}

function VisaCard({ info }: { info: VisaInfo }) {
  const showDays = info.maxStayDays > 0;

  return (
    <div className="shadow-glass-md rounded-[20px] border border-white/80 bg-white/88 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl leading-none">{info.icon}</span>
          <div>
            <p className="text-heading text-[15px] font-semibold tracking-[-0.02em]">
              {info.country}
            </p>
            {showDays && <p className="text-dim mt-0.5 text-xs">Up to {info.maxStayDays} days</p>}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${requirementBadgeClass(info.requirement)}`}
        >
          {info.label}
        </span>
      </div>

      {info.notes && <p className="text-dim mt-2.5 text-[13px] leading-relaxed">{info.notes}</p>}

      <a
        href={info.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand-primary mt-2.5 flex items-center gap-1 text-[12px] font-medium hover:underline"
      >
        <ExternalLink className="h-3 w-3" />
        {info.sourceLabel}
      </a>
    </div>
  );
}

function VisaSkeleton() {
  return (
    <div className="shadow-glass-md h-28 animate-pulse rounded-[20px] border border-white/80 bg-white/72" />
  );
}

export function VisaSection() {
  const { itinerary, visaLoading, visaError } = useTripContext();
  const travelerPrefs = useTravelerPreferences({ includeTransientFallback: true });
  const nationality = travelerPrefs.data?.nationality ?? "";

  const passportISO2 =
    NATIONALITY_TO_ISO2[nationality] ??
    (nationality.length === 2 ? nationality.toUpperCase() : undefined);

  const visaData = itinerary?.visaData ?? [];
  const destinationCodes = visaData.map((v) => v.countryCode);

  const hide = shouldHideVisaSection(visaData, passportISO2, destinationCodes);
  const showSchengenWarning = needsSchengenWarning(passportISO2, visaData);

  // Nothing to show: still loading with no cached data
  if (visaLoading && visaData.length === 0) {
    return (
      <section className="mt-6">
        <div className="mb-4">
          <p className="text-brand-primary text-[11px] font-bold tracking-[0.18em] uppercase">
            Visa Requirements
          </p>
          <h2 className="text-ink mt-1 text-[1.4rem] font-bold tracking-[-0.04em]">
            Entry requirements
          </h2>
        </div>
        <div className="space-y-3">
          <VisaSkeleton />
          <VisaSkeleton />
        </div>
      </section>
    );
  }

  // Section hidden for Schengen-to-Schengen or all-own-country trips
  if (hide) return null;

  // Error with no cached data
  if (visaError && visaData.length === 0) {
    return (
      <section className="mt-6">
        <AlertBox
          variant="error"
          title="Couldn't load visa requirements"
          description="Check back in a moment or visit IATA Timatic for visa information."
        />
      </section>
    );
  }

  if (visaData.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="mb-4">
        <p className="text-brand-primary text-[11px] font-bold tracking-[0.18em] uppercase">
          Visa Requirements
        </p>
        <h2 className="text-ink mt-1 text-[1.4rem] font-bold tracking-[-0.04em]">
          Entry requirements
        </h2>
      </div>

      {showSchengenWarning && (
        <div className="mb-3">
          <AlertBox
            variant="warning"
            title="Schengen 90/180-day rule applies"
            description="Your visa-free days are shared across all Schengen countries. You may stay a maximum of 90 days within any 180-day period across the entire Schengen Area."
          />
        </div>
      )}

      <div className="space-y-3">
        {visaData.map((info) => (
          <VisaCard key={info.countryCode} info={info} />
        ))}
      </div>
    </section>
  );
}
