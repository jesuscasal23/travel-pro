"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Clock, MapPin, Minus, Plane, Plus, Search, X } from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import { format, parse, addMonths } from "date-fns";
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
  const dateMode = usePlanFormStore((s) => s.dateMode);
  const setDateMode = usePlanFormStore((s) => s.setDateMode);
  const dayCount = usePlanFormStore((s) => s.dayCount);
  const setDayCount = usePlanFormStore((s) => s.setDayCount);
  const flexMonth = usePlanFormStore((s) => s.flexMonth);
  const setFlexMonth = usePlanFormStore((s) => s.setFlexMonth);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popularRef = useRef<HTMLElement>(null);

  const dateRange: DateRange | undefined = useMemo(() => {
    const from = dateStart ? parse(dateStart, "yyyy-MM-dd", new Date()) : undefined;
    const to = dateEnd ? parse(dateEnd, "yyyy-MM-dd", new Date()) : undefined;
    return from ? { from, to } : undefined;
  }, [dateStart, dateEnd]);

  const monthOptions = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = addMonths(now, i);
      return { value: format(d, "yyyy-MM"), label: format(d, "MMM yyyy") };
    });
  }, []);

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateStart(range?.from ? format(range.from, "yyyy-MM-dd") : "");
    setDateEnd(range?.to ? format(range.to, "yyyy-MM-dd") : "");
    clearError("dateStart");
    clearError("dateEnd");
  };

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
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !popularRef.current?.contains(target)
      ) {
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

      {/* Dates — exact or flexible mode */}
      <div>
        <p className="text-faint text-[11px] font-bold tracking-[0.2em] uppercase">Travel dates</p>

        {/* Mode toggle */}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setDateMode("exact")}
            className={`flex items-center gap-1.5 rounded-2xl border px-4 py-2 text-[12px] font-bold tracking-[0.06em] uppercase transition-all ${
              dateMode === "exact"
                ? "border-brand-primary bg-brand-primary-soft text-brand-primary"
                : "border-edge/80 text-dim bg-white/88"
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Exact dates
          </button>
          <button
            type="button"
            onClick={() => setDateMode("flexible")}
            className={`flex items-center gap-1.5 rounded-2xl border px-4 py-2 text-[12px] font-bold tracking-[0.06em] uppercase transition-all ${
              dateMode === "flexible"
                ? "border-brand-primary bg-brand-primary-soft text-brand-primary"
                : "border-edge/80 text-dim bg-white/88"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            I&apos;m flexible
          </button>
        </div>

        {dateMode === "exact" ? (
          <>
            {(dateStart || dateEnd) && (
              <p className="text-navy mt-3 text-sm font-medium">
                {dateStart
                  ? format(parse(dateStart, "yyyy-MM-dd", new Date()), "MMM d, yyyy")
                  : "—"}
                {" → "}
                {dateEnd ? format(parse(dateEnd, "yyyy-MM-dd", new Date()), "MMM d, yyyy") : "—"}
              </p>
            )}

            <div className="mt-3 flex justify-center">
              <DayPicker
                mode="range"
                selected={dateRange}
                onSelect={handleDateRangeSelect}
                disabled={{ before: new Date() }}
                numberOfMonths={1}
                showOutsideDays
                className="rdp-travel"
              />
            </div>
          </>
        ) : (
          <div className="mt-4 space-y-5">
            {/* Day count stepper */}
            <div>
              <p className="text-faint mb-2 text-[11px] font-bold tracking-[0.18em] uppercase">
                How many days?
              </p>
              <div className="border-edge/80 flex items-center justify-center gap-5 rounded-[16px] border bg-white px-5 py-3">
                <button
                  type="button"
                  onClick={() => setDayCount(Math.max(1, dayCount - 1))}
                  disabled={dayCount <= 1}
                  className="text-brand-primary flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 transition-colors disabled:opacity-30"
                >
                  <Minus className="h-4 w-4" strokeWidth={2.5} />
                </button>
                <span className="text-navy min-w-[80px] text-center text-2xl font-bold">
                  {dayCount} <span className="text-dim text-sm font-medium">days</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDayCount(Math.min(90, dayCount + 1))}
                  disabled={dayCount >= 90}
                  className="text-brand-primary flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 transition-colors disabled:opacity-30"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Month picker */}
            <div>
              <p className="text-faint mb-2 text-[11px] font-bold tracking-[0.18em] uppercase">
                Roughly when?
              </p>
              <div className="flex flex-wrap gap-2">
                {monthOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setFlexMonth(opt.value);
                      clearError("dateEnd");
                    }}
                    className={`rounded-2xl border px-3.5 py-2 text-[12px] font-bold tracking-[0.06em] uppercase transition-all ${
                      flexMonth === opt.value
                        ? "border-brand-primary bg-brand-primary-soft text-brand-primary"
                        : "border-edge/80 text-prose bg-white/88"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {errors.dateStart && <p className={travelFieldErrorClass}>{errors.dateStart}</p>}
        {errors.dateEnd && <p className={travelFieldErrorClass}>{errors.dateEnd}</p>}
      </div>

      {/* Popular destinations */}
      <section ref={popularRef}>
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
