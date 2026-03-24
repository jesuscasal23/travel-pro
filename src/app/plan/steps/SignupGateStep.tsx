"use client";

import { CalendarDays, MapPin } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useTripStore } from "@/stores/useTripStore";
import { useProfileState } from "@/hooks/useProfileState";
import { regions } from "@/data/sampleData";
import { travelStyles } from "@/data/travelStyles";
import { formatDateRange, daysBetween } from "@/lib/utils/format/date";

export function SignupGateStep() {
  const { tripType, region, destination, destinationCountry, dateStart, dateEnd } = useTripStore(
    useShallow((s) => ({
      tripType: s.tripType,
      region: s.region,
      destination: s.destination,
      destinationCountry: s.destinationCountry,
      dateStart: s.dateStart,
      dateEnd: s.dateEnd,
    }))
  );
  const { travelStyle, interests, pace } = useProfileState();

  const regionLabel = regions.find((r) => r.id === region)?.name ?? region;
  const destinationLabel =
    tripType === "multi-city"
      ? regionLabel
      : tripType === "single-country"
        ? destinationCountry
        : destination;

  const dateRange = formatDateRange(dateStart, dateEnd);
  const dayCount = dateStart && dateEnd ? daysBetween(dateStart, dateEnd) : 0;
  const budgetLabel = travelStyles.find((s) => s.id === travelStyle)?.label ?? "Smart Budget";
  const paceLabel =
    pace === "active" ? "The Sprinter" : pace === "relaxed" ? "The Soul Searcher" : "The Wanderer";

  return (
    <div className="space-y-5 pb-2">
      <div>
        <p className="text-brand-primary font-display text-[11px] font-bold tracking-[0.34em] uppercase">
          Almost there
        </p>
        <h2 className="text-navy mt-3 text-[30px] leading-[1.06] font-bold tracking-[-0.05em]">
          Your trip is ready
          <br />
          <span className="text-brand-primary">to be generated</span>
        </h2>
        <p className="text-dim mt-2 text-sm">
          Create a free account to unlock your personalised day-by-day itinerary, visa info, and
          flight prices.
        </p>
      </div>

      <section className="border-edge/80 shadow-glass-xl rounded-[34px] border bg-white/90 p-5 backdrop-blur-sm">
        <div className="border-edge/70 border-b pb-4">
          <div className="flex items-start gap-3">
            <div className="bg-brand-primary/10 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px]">
              <MapPin className="text-brand-primary h-4 w-4" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="text-faint text-[11px] font-bold tracking-[0.18em] uppercase">
                Destination
              </p>
              <p className="text-navy mt-0.5 text-[22px] leading-tight font-bold">
                {destinationLabel || "Your destination"}
              </p>
            </div>
          </div>

          {dateRange && (
            <div className="mt-3 flex items-center gap-2">
              <div className="bg-surface-neutral flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px]">
                <CalendarDays className="text-faint h-3.5 w-3.5" strokeWidth={2} />
              </div>
              <p className="text-dim text-sm font-medium">
                {dateRange}
                {dayCount > 0 && <span className="text-faint ml-1.5">· {dayCount} days</span>}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-surface-neutral rounded-[22px] p-3">
            <p className="text-faint text-[10px] font-bold tracking-[0.18em] uppercase">Budget</p>
            <p className="text-navy mt-1 text-[13px] leading-tight font-semibold">{budgetLabel}</p>
          </div>
          <div className="bg-surface-neutral rounded-[22px] p-3">
            <p className="text-faint text-[10px] font-bold tracking-[0.18em] uppercase">Pace</p>
            <p className="text-navy mt-1 text-[13px] leading-tight font-semibold">{paceLabel}</p>
          </div>
          <div className="bg-surface-neutral rounded-[22px] p-3">
            <p className="text-faint text-[10px] font-bold tracking-[0.18em] uppercase">
              Interests
            </p>
            <p className="text-navy mt-1 text-[13px] leading-tight font-semibold">
              {interests.length > 0 ? `${interests.length} selected` : "General"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
