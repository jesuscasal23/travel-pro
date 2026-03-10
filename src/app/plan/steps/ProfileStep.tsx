"use client";

import { useTripStore } from "@/stores/useTripStore";
import { nationalities } from "@/data/nationalities";
import { AirportCombobox } from "@/components/ui/AirportCombobox";
import { TripDescriptionCard } from "./TripDescriptionCard";

interface ProfileStepProps {
  errors: Record<string, string>;
  clearError: (field: string) => void;
}

const plannerInputClass =
  "border-v2-border focus:border-v2-orange focus:ring-0 text-v2-navy placeholder:text-v2-text-light w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition-colors";

export function ProfileStep({ errors, clearError }: ProfileStepProps) {
  const nationality = useTripStore((s) => s.nationality);
  const setNationality = useTripStore((s) => s.setNationality);
  const homeAirport = useTripStore((s) => s.homeAirport);
  const setHomeAirport = useTripStore((s) => s.setHomeAirport);

  return (
    <div className="space-y-6 pb-2">
      <div>
        <h2 className="text-v2-navy text-[28px] leading-tight font-bold">
          Tell us a bit about you
        </h2>
        <p className="text-v2-text-muted mt-2 text-sm">
          We use your profile for visa checks, flight context, and a more useful first itinerary
          draft.
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <label className="text-v2-navy mb-2 block text-sm font-semibold">Nationality</label>
          <select
            value={nationality}
            onChange={(event) => {
              setNationality(event.target.value);
              clearError("nationality");
            }}
            className={plannerInputClass}
            style={{ color: nationality ? "#1b2b4b" : "#9ca3af" }}
          >
            <option value="">Select your nationality</option>
            {nationalities.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
          {errors.nationality && <p className="text-v2-red mt-2 text-sm">{errors.nationality}</p>}
        </div>

        <div>
          <label className="text-v2-navy mb-2 block text-sm font-semibold">Home Airport</label>
          <AirportCombobox
            value={homeAirport}
            onChange={(value) => {
              setHomeAirport(value);
              clearError("homeAirport");
            }}
            className={plannerInputClass}
            variant="v2"
            placeholder="Search airport or city…"
          />
          {errors.homeAirport && <p className="text-v2-red mt-2 text-sm">{errors.homeAirport}</p>}
        </div>
      </section>

      <TripDescriptionCard compact />
    </div>
  );
}
