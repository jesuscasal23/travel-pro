"use client";

import { useTripStore } from "@/stores/useTripStore";
import { regions } from "@/data/sampleData";
import { CityCombobox } from "@/components/ui/CityCombobox";
import { CountryCombobox } from "@/components/ui/CountryCombobox";

interface DestinationStepProps {
  errors: Record<string, string>;
  clearError: (field: string) => void;
}

const plannerInputClass =
  "border-v2-border focus:border-v2-orange focus:ring-0 text-v2-navy placeholder:text-v2-text-light w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition-colors";

const tripTypeOptions = [
  { value: "single-city", label: "City" },
  { value: "single-country", label: "Country" },
  { value: "multi-city", label: "Region" },
] as const;

export function DestinationStep({ errors, clearError }: DestinationStepProps) {
  const tripType = useTripStore((s) => s.tripType);
  const setTripType = useTripStore((s) => s.setTripType);
  const region = useTripStore((s) => s.region);
  const setRegion = useTripStore((s) => s.setRegion);
  const destination = useTripStore((s) => s.destination);
  const destinationCountry = useTripStore((s) => s.destinationCountry);
  const setDestination = useTripStore((s) => s.setDestination);
  const clearDestination = useTripStore((s) => s.clearDestination);

  const isSingleCity = tripType === "single-city";
  const isSingleCountry = tripType === "single-country";

  return (
    <div className="space-y-6 pb-2">
      <div>
        <h2 className="text-v2-navy text-[28px] leading-tight font-bold">Where are you headed?</h2>
        <p className="text-v2-text-muted mt-2 text-sm">
          Start with the destination shape. We&apos;ll ask for dates on the next screen.
        </p>
      </div>

      <section>
        <p className="text-v2-text-muted mb-3 text-xs font-bold tracking-[0.22em] uppercase">
          Trip Type
        </p>
        <div className="bg-v2-chip-bg grid grid-cols-3 gap-1 rounded-2xl p-1">
          {tripTypeOptions.map((option) => {
            const isSelected = tripType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setTripType(option.value);
                  setRegion("");
                  clearDestination();
                  clearError("region");
                  clearError("destination");
                  clearError("destinationCountry");
                }}
                aria-pressed={isSelected}
                className={`rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                  isSelected
                    ? "bg-v2-orange text-white shadow-[0_10px_24px_rgba(249,115,22,0.22)]"
                    : "text-v2-navy"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <label className="text-v2-navy mb-2 block text-sm font-semibold">
          {isSingleCity ? "City" : isSingleCountry ? "Country" : "Region"}
        </label>

        {isSingleCity ? (
          <>
            <CityCombobox
              value={destination ? `${destination}, ${destinationCountry}` : ""}
              onChange={(entry) => {
                setDestination(entry.city, entry.country, entry.countryCode, entry.lat, entry.lng);
                clearError("destination");
              }}
              className={plannerInputClass}
              variant="v2"
            />
            {errors.destination && <p className="text-v2-red mt-2 text-sm">{errors.destination}</p>}
          </>
        ) : isSingleCountry ? (
          <>
            <CountryCombobox
              value={destinationCountry}
              onChange={(entry) => {
                setDestination("", entry.country, entry.countryCode, entry.lat, entry.lng);
                clearError("destinationCountry");
              }}
              className={plannerInputClass}
              variant="v2"
            />
            {errors.destinationCountry && (
              <p className="text-v2-red mt-2 text-sm">{errors.destinationCountry}</p>
            )}
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              {regions.map((item) => {
                const isSelected = region === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setRegion(item.id);
                      clearError("region");
                    }}
                    className={`rounded-2xl border p-3 text-left transition-all ${
                      isSelected
                        ? "bg-v2-orange border-v2-orange text-white"
                        : "border-v2-border text-v2-navy bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-bold">{item.name}</span>
                      {item.popular && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            isSelected ? "bg-white/20 text-white" : "bg-v2-chip-bg text-v2-orange"
                          }`}
                        >
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed opacity-80">
                      {item.countries}
                    </p>
                  </button>
                );
              })}
            </div>
            {errors.region && <p className="text-v2-red mt-2 text-sm">{errors.region}</p>}
          </>
        )}
      </section>
    </div>
  );
}
