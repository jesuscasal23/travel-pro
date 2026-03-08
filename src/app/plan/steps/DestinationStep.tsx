"use client";

import { useTripStore } from "@/stores/useTripStore";
import { regions } from "@/data/sampleData";
import { Badge, FormField, SelectionCard } from "@/components/ui";
import { inputClass } from "@/components/auth/auth-styles";
import { CityCombobox } from "@/components/ui/CityCombobox";
import { CountryCombobox } from "@/components/ui/CountryCombobox";

interface DestinationStepProps {
  errors: Record<string, string>;
  clearError: (field: string) => void;
}

export function DestinationStep({ errors, clearError }: DestinationStepProps) {
  const tripType = useTripStore((s) => s.tripType);
  const setTripType = useTripStore((s) => s.setTripType);
  const region = useTripStore((s) => s.region);
  const setRegion = useTripStore((s) => s.setRegion);
  const destination = useTripStore((s) => s.destination);
  const destinationCountry = useTripStore((s) => s.destinationCountry);
  const setDestination = useTripStore((s) => s.setDestination);
  const clearDestination = useTripStore((s) => s.clearDestination);
  const dateStart = useTripStore((s) => s.dateStart);
  const setDateStart = useTripStore((s) => s.setDateStart);
  const dateEnd = useTripStore((s) => s.dateEnd);
  const setDateEnd = useTripStore((s) => s.setDateEnd);
  const travelers = useTripStore((s) => s.travelers);
  const setTravelers = useTripStore((s) => s.setTravelers);

  const isSingleCity = tripType === "single-city";
  const isSingleCountry = tripType === "single-country";

  return (
    <div>
      <h2 className="text-foreground mb-1 text-2xl font-bold">Where & when?</h2>
      <p className="text-muted-foreground mb-6">Pick your destination and travel dates.</p>

      {/* Trip type toggle */}
      <div className="bg-secondary mb-6 flex gap-0 rounded-xl p-1">
        {(
          [
            { value: "single-city", label: "One City" },
            { value: "single-country", label: "One Country" },
            { value: "multi-city", label: "Region" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setTripType(opt.value);
              setRegion("");
              clearDestination();
            }}
            className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              tripType === opt.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Destination input */}
      {isSingleCity ? (
        <FormField label="City" className="mb-6" error={errors.destination}>
          <CityCombobox
            value={destination ? `${destination}, ${destinationCountry}` : ""}
            onChange={(entry) => {
              setDestination(entry.city, entry.country, entry.countryCode, entry.lat, entry.lng);
              clearError("destination");
            }}
          />
        </FormField>
      ) : isSingleCountry ? (
        <FormField label="Country" className="mb-6" error={errors.destinationCountry}>
          <CountryCombobox
            value={destinationCountry}
            onChange={(entry) => {
              setDestination("", entry.country, entry.countryCode, entry.lat, entry.lng);
              clearError("destinationCountry");
            }}
          />
        </FormField>
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-2">
          {regions.map((r) => (
            <SelectionCard
              key={r.id}
              selected={region === r.id}
              onClick={() => {
                setRegion(r.id);
                clearError("region");
              }}
              className="!p-3"
            >
              <div className="flex items-start justify-between gap-1">
                <div className="text-foreground text-sm font-semibold">{r.name}</div>
                {r.popular && (
                  <Badge variant="info" className="shrink-0 text-[10px]">
                    Popular
                  </Badge>
                )}
              </div>
              <div className="text-muted-foreground mt-0.5 text-xs leading-snug">{r.countries}</div>
            </SelectionCard>
          ))}
          {errors.region && (
            <p className="text-sm text-red-500 dark:text-red-400">{errors.region}</p>
          )}
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Start date" error={errors.dateStart}>
          <input
            type="date"
            value={dateStart}
            onChange={(e) => {
              setDateStart(e.target.value);
              clearError("dateStart");
            }}
            className={inputClass}
          />
        </FormField>
        <FormField label="End date" error={errors.dateEnd}>
          <input
            type="date"
            value={dateEnd}
            onChange={(e) => {
              setDateEnd(e.target.value);
              clearError("dateEnd");
            }}
            min={dateStart}
            className={inputClass}
          />
        </FormField>
      </div>

      {/* Travelers */}
      <div className="border-border bg-background mt-4 flex items-center justify-between rounded-xl border px-4 py-3">
        <span className="text-foreground text-sm font-medium">Travelers</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTravelers(Math.max(1, travelers - 1))}
            className="border-border text-foreground hover:border-primary hover:bg-primary/5 flex h-8 w-8 items-center justify-center rounded-full border text-lg font-bold transition-all"
          >
            −
          </button>
          <span className="text-primary w-6 text-center text-lg font-bold">{travelers}</span>
          <button
            onClick={() => setTravelers(Math.min(10, travelers + 1))}
            className="border-border text-foreground hover:border-primary hover:bg-primary/5 flex h-8 w-8 items-center justify-center rounded-full border text-lg font-bold transition-all"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
