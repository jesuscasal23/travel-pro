"use client";

import { CalendarDays, Users } from "lucide-react";
import { useTripStore } from "@/stores/useTripStore";

interface ScheduleStepProps {
  errors: Record<string, string>;
  clearError: (field: string) => void;
}

const plannerInputClass =
  "border-v2-border focus:border-v2-orange focus:ring-0 text-v2-navy placeholder:text-v2-text-light w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition-colors";

export function ScheduleStep({ errors, clearError }: ScheduleStepProps) {
  const dateStart = useTripStore((s) => s.dateStart);
  const setDateStart = useTripStore((s) => s.setDateStart);
  const dateEnd = useTripStore((s) => s.dateEnd);
  const setDateEnd = useTripStore((s) => s.setDateEnd);
  const travelers = useTripStore((s) => s.travelers);
  const setTravelers = useTripStore((s) => s.setTravelers);

  const duration = (() => {
    if (!dateStart || !dateEnd) return null;
    const days = Math.round(
      (new Date(dateEnd).getTime() - new Date(dateStart).getTime()) / 86400000
    );
    return days > 0 ? days : null;
  })();

  return (
    <div className="space-y-6 pb-2">
      <div>
        <h2 className="text-v2-navy text-[28px] leading-tight font-bold">When are you going?</h2>
        <p className="text-v2-text-muted mt-2 text-sm">
          Dates and traveler count help us keep the routing and hotel suggestions realistic.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-v2-navy mb-2 flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="text-v2-text-muted h-4 w-4" />
            Start date
          </label>
          <input
            type="date"
            value={dateStart}
            onChange={(event) => {
              setDateStart(event.target.value);
              clearError("dateStart");
            }}
            className={plannerInputClass}
            style={{ color: dateStart ? "#1b2b4b" : "#9ca3af" }}
          />
          {errors.dateStart && <p className="text-v2-red mt-2 text-sm">{errors.dateStart}</p>}
        </div>

        <div>
          <label className="text-v2-navy mb-2 flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="text-v2-text-muted h-4 w-4" />
            End date
          </label>
          <input
            type="date"
            value={dateEnd}
            min={dateStart}
            onChange={(event) => {
              setDateEnd(event.target.value);
              clearError("dateEnd");
            }}
            className={plannerInputClass}
            style={{ color: dateEnd ? "#1b2b4b" : "#9ca3af" }}
          />
          {errors.dateEnd && <p className="text-v2-red mt-2 text-sm">{errors.dateEnd}</p>}
        </div>
      </section>

      <section className="border-v2-border rounded-[24px] border bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-v2-navy flex items-center gap-2 text-sm font-semibold">
              <Users className="text-v2-text-muted h-4 w-4" />
              Travelers
            </p>
            <p className="text-v2-text-muted mt-1 text-sm">
              {duration
                ? `${duration} nights planned for the trip.`
                : "Add your group size for better planning."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTravelers(Math.max(1, travelers - 1))}
              className="border-v2-border text-v2-navy hover:border-v2-orange hover:text-v2-orange flex h-10 w-10 items-center justify-center rounded-full border text-lg font-bold transition-colors"
            >
              −
            </button>
            <span className="text-v2-orange w-6 text-center text-xl font-bold">{travelers}</span>
            <button
              type="button"
              onClick={() => setTravelers(Math.min(10, travelers + 1))}
              className="border-v2-border text-v2-navy hover:border-v2-orange hover:text-v2-orange flex h-10 w-10 items-center justify-center rounded-full border text-lg font-bold transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
