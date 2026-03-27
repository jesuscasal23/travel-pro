"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, MapPin, Plane, Search, X } from "lucide-react";
import { CITIES, type CityEntry } from "@/data/cities";
import { AIRPORTS } from "@/data/airports-full";
import { lookupIata } from "@/lib/flights/city-iata-map";
import { usePlanFormStore, type SelectedCity } from "@/stores/usePlanFormStore";
import { travelFieldErrorClass, travelInputClass } from "@/components/ui/styles";
import { StepBadge } from "./StepBadge";

interface DestinationStepProps {
  errors: Record<string, string>;
  clearError: (field: string) => void;
  step: number;
  totalSteps: number;
}

const POPULAR_CITIES: SelectedCity[] = [
  { city: "Bangkok", country: "Thailand", countryCode: "TH", lat: 13.756, lng: 100.502 },
  { city: "Tokyo", country: "Japan", countryCode: "JP", lat: 35.689, lng: 139.692 },
  { city: "Paris", country: "France", countryCode: "FR", lat: 48.857, lng: 2.347 },
  { city: "Barcelona", country: "Spain", countryCode: "ES", lat: 41.388, lng: 2.17 },
  { city: "Rome", country: "Italy", countryCode: "IT", lat: 41.9, lng: 12.483 },
  { city: "Bali", country: "Indonesia", countryCode: "ID", lat: -8.409, lng: 115.189 },
];

function cityKey(city: SelectedCity) {
  return `${city.countryCode}-${city.city}`;
}

function AirportPicker({
  countryCode,
  cityName,
  onSelect,
}: {
  countryCode: string;
  cityName: string;
  onSelect: (iata: string) => void;
}) {
  const [airportQuery, setAirportQuery] = useState("");
  const [airportOpen, setAirportOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const countryAirports = useMemo(
    () => AIRPORTS.filter((a) => a.country === countryCode),
    [countryCode]
  );

  const filteredAirports = useMemo(() => {
    const q = airportQuery.trim().toLowerCase();
    if (!q) return countryAirports.slice(0, 8);
    return countryAirports
      .filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q) ||
          a.iata.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [airportQuery, countryAirports]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setAirportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={pickerRef} className="relative mt-1 mr-4 ml-9">
      <div className="flex items-center gap-2 rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2">
        <Plane className="h-3.5 w-3.5 shrink-0 text-amber-600" />
        <p className="text-xs text-amber-800">
          Select the airport for <span className="font-semibold">{cityName}</span>
        </p>
      </div>
      <div className="relative mt-1.5">
        <Search className="text-subtext pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
        <input
          type="text"
          value={airportQuery}
          onFocus={() => setAirportOpen(true)}
          onChange={(e) => {
            setAirportQuery(e.target.value);
            setAirportOpen(true);
          }}
          placeholder="Search airports..."
          className={`${travelInputClass} min-h-[44px] rounded-[12px] pl-9 text-[14px]`}
        />
        {airportOpen && filteredAirports.length > 0 && (
          <div className="border-edge shadow-glass-lg absolute top-[calc(100%+0.25rem)] z-40 w-full overflow-hidden rounded-[16px] border bg-white">
            {filteredAirports.map((airport) => (
              <button
                key={airport.iata}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(airport.iata);
                }}
                className="border-edge/70 hover:bg-surface-hover flex w-full items-center gap-3 border-b px-3 py-2.5 text-left last:border-b-0"
              >
                <span className="text-brand-primary shrink-0 text-xs font-bold">
                  {airport.iata}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-navy truncate text-sm font-medium">{airport.name}</p>
                  <p className="text-dim text-xs">{airport.city}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        {airportOpen && filteredAirports.length === 0 && airportQuery.trim() && (
          <div className="border-edge absolute top-[calc(100%+0.25rem)] z-40 w-full rounded-[16px] border bg-white px-4 py-3 text-center">
            <p className="text-dim text-sm">No airports found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function DestinationStep({ errors, clearError, step, totalSteps }: DestinationStepProps) {
  const selectedCities = usePlanFormStore((s) => s.selectedCities);
  const addCity = usePlanFormStore((s) => s.addCity);
  const removeCity = usePlanFormStore((s) => s.removeCity);
  const updateCityIata = usePlanFormStore((s) => s.updateCityIata);
  const dateStart = usePlanFormStore((s) => s.dateStart);
  const setDateStart = usePlanFormStore((s) => s.setDateStart);
  const dateEnd = usePlanFormStore((s) => s.dateEnd);
  const setDateEnd = usePlanFormStore((s) => s.setDateEnd);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedKeys = useMemo(() => new Set(selectedCities.map(cityKey)), [selectedCities]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [] as CityEntry[];
    return CITIES.filter(
      (entry) =>
        entry.city.toLowerCase().includes(normalized) ||
        entry.country.toLowerCase().includes(normalized) ||
        entry.countryCode.toLowerCase().startsWith(normalized)
    ).slice(0, 8);
  }, [query]);

  const handleSelect = (entry: CityEntry) => {
    const iataCode = lookupIata(entry.city);
    const city: SelectedCity = {
      city: entry.city,
      country: entry.country,
      countryCode: entry.countryCode,
      lat: entry.lat,
      lng: entry.lng,
      iataCode,
    };
    if (!selectedKeys.has(cityKey(city))) {
      addCity(city);
      clearError("selectedCities");
    }
    setQuery("");
    setOpen(false);
  };

  const handleAddPopular = (city: SelectedCity) => {
    if (!selectedKeys.has(cityKey(city))) {
      const iataCode = city.iataCode ?? lookupIata(city.city);
      addCity({ ...city, iataCode });
      clearError("selectedCities");
    }
  };

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

  return (
    <div className="space-y-7 pb-2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-brand-primary font-display text-[11px] font-bold tracking-[0.34em] uppercase">
            Destination
          </p>
          <h2 className="text-navy text-[28px] leading-tight font-bold">
            Where to <span className="text-brand-primary italic">next?</span>
          </h2>
          <p className="text-dim mt-2 text-sm">Add one or more cities you want to visit.</p>
        </div>
        <StepBadge step={step} totalSteps={totalSteps} />
      </div>

      {/* City search */}
      <div>
        <p className="text-faint text-[11px] font-bold tracking-[0.2em] uppercase">Cities</p>

        <div ref={containerRef} className="relative mt-3">
          <div className="text-subtext pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            placeholder="Search cities..."
            className={`${travelInputClass} min-h-[58px] rounded-[18px] pl-11 text-[16px]`}
          />

          {open && results.length > 0 && (
            <div className="border-edge shadow-glass-lg absolute top-[calc(100%+0.5rem)] z-40 w-full overflow-hidden rounded-[24px] border bg-white">
              {results.map((entry) => {
                const key = `${entry.countryCode}-${entry.city}`;
                const already = selectedKeys.has(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (!already) handleSelect(entry);
                    }}
                    disabled={already}
                    className={`border-edge/70 flex w-full items-center justify-between border-b px-4 py-3 text-left last:border-b-0 ${
                      already ? "cursor-default opacity-40" : "hover:bg-surface-hover"
                    }`}
                  >
                    <div>
                      <p className="text-navy text-sm font-semibold">{entry.city}</p>
                      <p className="text-dim mt-0.5 text-xs">{entry.country}</p>
                    </div>
                    <MapPin className="text-subtext h-4 w-4 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected cities list */}
        {selectedCities.length > 0 && (
          <ul className="mt-3 space-y-2">
            {selectedCities.map((city, i) => (
              <li key={`${cityKey(city)}-${i}`}>
                <div className="border-edge/80 flex items-center gap-3 rounded-[16px] border bg-white px-4 py-3">
                  <span className="text-brand-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-navy text-sm font-semibold">
                      {city.city}
                      {city.iataCode && (
                        <span className="text-dim ml-1.5 text-xs font-normal">
                          ({city.iataCode})
                        </span>
                      )}
                    </p>
                    <p className="text-dim text-xs">{city.country}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCity(i)}
                    className="text-subtext hover:text-navy shrink-0 transition-colors"
                    aria-label={`Remove ${city.city}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {!city.iataCode && (
                  <AirportPicker
                    countryCode={city.countryCode}
                    cityName={city.city}
                    onSelect={(iata) => updateCityIata(i, iata)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}

        {errors.selectedCities && (
          <p className={`${travelFieldErrorClass} mt-2`}>{errors.selectedCities}</p>
        )}
      </div>

      {/* Dates */}
      <div>
        <label className="text-faint mb-2 block text-[11px] font-bold tracking-[0.18em] uppercase">
          Start
        </label>
        <div className="relative">
          <CalendarDays className="text-subtext pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
          <input
            type="date"
            value={dateStart}
            onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
            onChange={(e) => {
              setDateStart(e.target.value);
              clearError("dateStart");
            }}
            className={`${travelInputClass} min-h-[56px] rounded-[18px] pl-11 text-[16px]`}
            style={{ color: dateStart ? "var(--color-navy)" : "var(--color-faint)" }}
          />
        </div>
        {errors.dateStart && <p className={travelFieldErrorClass}>{errors.dateStart}</p>}
      </div>

      <div>
        <label className="text-faint mb-2 block text-[11px] font-bold tracking-[0.18em] uppercase">
          End
        </label>
        <div className="relative">
          <CalendarDays className="text-subtext pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
          <input
            type="date"
            value={dateEnd}
            min={dateStart}
            onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
            onChange={(e) => {
              setDateEnd(e.target.value);
              clearError("dateEnd");
            }}
            className={`${travelInputClass} min-h-[56px] rounded-[18px] pl-11 text-[16px]`}
            style={{ color: dateEnd ? "var(--color-navy)" : "var(--color-faint)" }}
          />
        </div>
        {errors.dateEnd && <p className={travelFieldErrorClass}>{errors.dateEnd}</p>}
      </div>

      {/* Popular destinations */}
      <section>
        <p className="text-faint mb-3 text-[11px] font-bold tracking-[0.2em] uppercase">
          Popular Destinations
        </p>
        <div className="flex flex-wrap gap-2.5">
          {POPULAR_CITIES.map((city) => {
            const isSelected = selectedKeys.has(cityKey(city));
            return (
              <button
                key={cityKey(city)}
                type="button"
                onClick={() => handleAddPopular(city)}
                disabled={isSelected}
                className={`rounded-2xl border px-4 py-2.5 text-[12px] font-bold tracking-[0.08em] uppercase transition-all ${
                  isSelected
                    ? "border-brand-primary bg-brand-primary-soft text-brand-primary cursor-default opacity-60"
                    : "border-edge/80 text-prose bg-white/88"
                }`}
              >
                {city.city}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
