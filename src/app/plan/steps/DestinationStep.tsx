"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, LocateFixed, MapPinned, Search } from "lucide-react";
import { CITIES, type CityEntry } from "@/data/cities";
import { regions } from "@/data/sampleData";
import { useTripStore } from "@/stores/useTripStore";
import { travelFieldErrorClass, travelInputClass } from "@/components/forms/travel-field-styles";
import { StepBadge } from "./StepBadge";

interface DestinationStepProps {
  errors: Record<string, string>;
  clearError: (field: string) => void;
  step: number;
  totalSteps: number;
}

type SearchResult =
  | {
      key: string;
      kind: "city";
      label: string;
      detail: string;
      city: CityEntry;
    }
  | {
      key: string;
      kind: "country";
      label: string;
      detail: string;
      country: { country: string; countryCode: string; lat: number; lng: number };
    };

const countries = (() => {
  const seen = new Map<
    string,
    { country: string; countryCode: string; lat: number; lng: number }
  >();
  for (const city of CITIES) {
    if (!seen.has(city.countryCode)) {
      seen.set(city.countryCode, {
        country: city.country,
        countryCode: city.countryCode,
        lat: city.lat,
        lng: city.lng,
      });
    }
  }
  return Array.from(seen.values());
})();

function getSelectedLabel({
  tripType,
  destination,
  destinationCountry,
  region,
}: {
  tripType: string;
  destination: string;
  destinationCountry: string;
  region: string;
}) {
  if (tripType === "multi-city") {
    return regions.find((item) => item.id === region)?.name ?? "";
  }
  if (tripType === "single-country") return destinationCountry;
  if (tripType === "single-city" && destination) return `${destination}, ${destinationCountry}`;
  return "";
}

export function DestinationStep({ errors, clearError, step, totalSteps }: DestinationStepProps) {
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

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = getSelectedLabel({ tripType, destination, destinationCountry, region });

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [] as SearchResult[];

    const cityResults: SearchResult[] = CITIES.filter(
      (entry) =>
        entry.city.toLowerCase().includes(normalized) ||
        entry.country.toLowerCase().includes(normalized) ||
        entry.countryCode.toLowerCase().startsWith(normalized)
    )
      .slice(0, 5)
      .map((entry) => ({
        key: `city-${entry.countryCode}-${entry.city}`,
        kind: "city" as const,
        label: entry.city,
        detail: entry.country,
        city: entry,
      }));

    const countryResults: SearchResult[] = countries
      .filter(
        (entry) =>
          entry.country.toLowerCase().includes(normalized) ||
          entry.countryCode.toLowerCase().startsWith(normalized)
      )
      .slice(0, 5)
      .map((entry) => ({
        key: `country-${entry.countryCode}`,
        kind: "country" as const,
        label: entry.country,
        detail: entry.countryCode,
        country: entry,
      }));

    return [...cityResults, ...countryResults];
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectResult = (result: SearchResult) => {
    if (result.kind === "city") {
      setTripType("single-city");
      setRegion("");
      setDestination(
        result.city.city,
        result.city.country,
        result.city.countryCode,
        result.city.lat,
        result.city.lng
      );
      clearError("destination");
      clearError("destinationCountry");
      clearError("region");
    } else {
      setTripType("single-country");
      setRegion("");
      setDestination(
        "",
        result.country.country,
        result.country.countryCode,
        result.country.lat,
        result.country.lng
      );
      clearError("destinationCountry");
      clearError("destination");
      clearError("region");
    }

    setOpen(false);
    setQuery("");
  };

  return (
    <div className="space-y-7 pb-2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-brand-primary font-display text-[11px] font-bold tracking-[0.34em] uppercase">
            Destination
          </p>
          <h2 className="text-v2-navy text-[28px] leading-tight font-bold">
            Where to <span className="text-brand-primary italic">next?</span>
          </h2>
          <p className="text-v2-text-muted mt-2 text-sm">
            Your dream trip starts with a single pin on the map.
          </p>
        </div>
        <StepBadge step={step} totalSteps={totalSteps} />
      </div>

      <section className="border-v2-border/80 rounded-[34px] border bg-white/88 p-5 shadow-[0_24px_48px_rgba(27,43,75,0.06)] backdrop-blur-sm">
        <div>
          <p className="text-v2-text-light text-[11px] font-bold tracking-[0.2em] uppercase">
            Where
          </p>

          <div ref={containerRef} className="relative mt-3">
            <div className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 text-[#9aacbf]">
              {selectedLabel && !open ? (
                <LocateFixed className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </div>
            <input
              type="text"
              value={open ? query : selectedLabel}
              onFocus={() => setOpen(true)}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              placeholder="Search cities, countries..."
              className={`${travelInputClass} min-h-[58px] rounded-[18px] border-white/80 bg-white/92 pl-11 text-[16px] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]`}
            />

            {open && results.length > 0 && (
              <div className="border-v2-border absolute top-[calc(100%+0.5rem)] z-40 w-full overflow-hidden rounded-[24px] border bg-white shadow-[0_20px_40px_rgba(27,43,75,0.12)]">
                {results.map((result) => (
                  <button
                    key={result.key}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      handleSelectResult(result);
                    }}
                    className="border-v2-border/70 flex w-full items-center justify-between border-b px-4 py-3 text-left last:border-b-0 hover:bg-[#f7faff]"
                  >
                    <div>
                      <p className="text-v2-navy text-sm font-semibold">{result.label}</p>
                      <p className="text-v2-text-muted mt-0.5 text-xs">{result.detail}</p>
                    </div>
                    <MapPinned className="h-4 w-4 text-[#9aacbf]" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {(errors.destination || errors.destinationCountry || errors.region) && (
            <p className={`${travelFieldErrorClass} mt-2`}>
              {errors.destination || errors.destinationCountry || errors.region}
            </p>
          )}
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-v2-text-light text-[11px] font-bold tracking-[0.2em] uppercase">
              When
            </p>
            <span className="rounded-2xl bg-[#101114] px-4 py-2 text-[11px] font-bold tracking-[0.18em] text-white uppercase shadow-[0_10px_24px_rgba(16,17,20,0.14)]">
              Dates
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-v2-text-light mb-2 block text-[11px] font-bold tracking-[0.18em] uppercase">
                Start
              </label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#9aacbf]" />
                <input
                  type="date"
                  value={dateStart}
                  onChange={(event) => {
                    setDateStart(event.target.value);
                    clearError("dateStart");
                  }}
                  className={`${travelInputClass} min-h-[56px] rounded-[18px] border-white/80 bg-white/92 pl-11`}
                  style={{ color: dateStart ? "#1b2b4b" : "#9ca3af" }}
                />
              </div>
              {errors.dateStart && <p className={travelFieldErrorClass}>{errors.dateStart}</p>}
            </div>

            <div>
              <label className="text-v2-text-light mb-2 block text-[11px] font-bold tracking-[0.18em] uppercase">
                End
              </label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#9aacbf]" />
                <input
                  type="date"
                  value={dateEnd}
                  min={dateStart}
                  onChange={(event) => {
                    setDateEnd(event.target.value);
                    clearError("dateEnd");
                  }}
                  className={`${travelInputClass} min-h-[56px] rounded-[18px] border-white/80 bg-white/92 pl-11`}
                  style={{ color: dateEnd ? "#1b2b4b" : "#9ca3af" }}
                />
              </div>
              {errors.dateEnd && <p className={travelFieldErrorClass}>{errors.dateEnd}</p>}
            </div>
          </div>
        </div>
      </section>

      <section>
        <p className="text-v2-text-light mb-3 text-[11px] font-bold tracking-[0.2em] uppercase">
          Popular Right Now
        </p>
        <div className="flex flex-wrap gap-2.5">
          {regions
            .filter((item) => item.popular)
            .map((item) => {
              const isSelected = tripType === "multi-city" && region === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTripType("multi-city");
                    setRegion(item.id);
                    clearDestination();
                    clearError("region");
                    clearError("destination");
                    clearError("destinationCountry");
                  }}
                  className={`rounded-2xl border px-4 py-2.5 text-[12px] font-bold tracking-[0.08em] uppercase transition-all ${
                    isSelected
                      ? "border-brand-primary bg-brand-primary-soft text-brand-primary shadow-[var(--shadow-brand-md)]"
                      : "border-v2-border/80 bg-white/88 text-[#59657a]"
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
        </div>
      </section>
    </div>
  );
}
