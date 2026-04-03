"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  MapPin,
  Minus,
  Plus,
  Repeat,
  Search,
  X,
} from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import { format, parse } from "date-fns";
import { lookupIata } from "@/lib/flights/city-iata-map";
import { usePlanFormStore, type SelectedCity } from "@/stores/usePlanFormStore";
import { travelFieldErrorClass, travelInputClass } from "@/components/ui/styles";
import { StepBadge } from "./StepBadge";
import type { CityRecord } from "@/types";
import { useCities } from "@/hooks/api";

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

function toSelectedCity(entry: CityRecord): SelectedCity {
  return {
    city: entry.city,
    country: entry.country,
    countryCode: entry.countryCode,
    lat: entry.lat,
    lng: entry.lng,
    iataCode: lookupIata(entry.city),
  };
}

/* ── Toggle pill (shared by date mode + trip direction) ── */

function TogglePill({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-2xl border px-4 py-2 text-[12px] font-bold tracking-[0.06em] uppercase transition-all ${
        active
          ? "border-brand-primary bg-brand-primary-soft text-brand-primary"
          : "border-edge/80 text-dim bg-white/88 dark:border-white/10 dark:bg-white/5 dark:text-white/50"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/* ── Section card wrapper ── */

function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border-edge/60 rounded-[20px] border bg-white/80 p-5 shadow-[var(--shadow-glass-sm)] dark:border-white/8 dark:bg-white/[0.03] ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Section label ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-faint mb-3 text-[11px] font-bold tracking-[0.2em] uppercase dark:text-white/40">
      {children}
    </p>
  );
}

export function DestinationStep({ errors, clearError, step, totalSteps }: DestinationStepProps) {
  const selectedCities = usePlanFormStore((s) => s.selectedCities);
  const addCity = usePlanFormStore((s) => s.addCity);
  const removeCity = usePlanFormStore((s) => s.removeCity);
  const dateStart = usePlanFormStore((s) => s.dateStart);
  const setDateStart = usePlanFormStore((s) => s.setDateStart);
  const dateEnd = usePlanFormStore((s) => s.dateEnd);
  const setDateEnd = usePlanFormStore((s) => s.setDateEnd);
  const dateMode = usePlanFormStore((s) => s.dateMode);
  const setDateMode = usePlanFormStore((s) => s.setDateMode);
  const dayCount = usePlanFormStore((s) => s.dayCount);
  const setDayCount = usePlanFormStore((s) => s.setDayCount);
  const tripDirection = usePlanFormStore((s) => s.tripDirection);
  const setTripDirection = usePlanFormStore((s) => s.setTripDirection);
  const { data: cityCatalog, isPending: isCitiesLoading, error: citiesError } = useCities();
  const cities = cityCatalog ?? [];
  const quickPickCities = useMemo(() => {
    if (cities.length === 0) return POPULAR_CITIES;
    return POPULAR_CITIES.map((preset) => {
      const match = cities.find(
        (entry) =>
          entry.countryCode === preset.countryCode &&
          entry.city.toLowerCase() === preset.city.toLowerCase()
      );
      return match ? toSelectedCity(match) : preset;
    });
  }, [cities]);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const dateRange: DateRange | undefined = useMemo(() => {
    const from = dateStart ? parse(dateStart, "yyyy-MM-dd", new Date()) : undefined;
    const to = dateEnd ? parse(dateEnd, "yyyy-MM-dd", new Date()) : undefined;
    return from ? { from, to } : undefined;
  }, [dateStart, dateEnd]);

  const defaultMonth = useMemo(() => {
    if (dateRange?.from) {
      return new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), 1);
    }

    const today = new Date();
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const selectableDaysLeft = lastDayOfMonth.getDate() - normalizedToday.getDate() + 1;

    if (selectableDaysLeft < 3) {
      return new Date(today.getFullYear(), today.getMonth() + 1, 1);
    }

    return normalizedToday;
  }, [dateRange]);

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateStart(range?.from ? format(range.from, "yyyy-MM-dd") : "");
    setDateEnd(range?.to ? format(range.to, "yyyy-MM-dd") : "");
    clearError("dateStart");
    clearError("dateEnd");
  };

  const selectedKeys = useMemo(() => new Set(selectedCities.map(cityKey)), [selectedCities]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [] as CityRecord[];
    return cities
      .filter(
        (entry) =>
          entry.city.toLowerCase().includes(normalized) ||
          entry.country.toLowerCase().includes(normalized) ||
          entry.countryCode.toLowerCase().startsWith(normalized)
      )
      .slice(0, 8);
  }, [cities, query]);

  const handleSelect = (entry: CityRecord) => {
    const city = toSelectedCity(entry);
    if (!selectedKeys.has(cityKey(city))) {
      addCity(city);
      clearError("selectedCities");
    }
    setQuery("");
    setOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-5 pb-2">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-brand-primary font-display text-[11px] font-bold tracking-[0.34em] uppercase">
            Destination
          </p>
          <h2 className="text-navy text-[28px] leading-tight font-bold dark:text-white">
            Where to <span className="text-brand-primary italic">next?</span>
          </h2>
          <p className="text-dim mt-1.5 text-sm dark:text-white/50">
            Add one or more cities you want to visit.
          </p>
        </div>
        <StepBadge step={step} totalSteps={totalSteps} />
      </div>

      {/* ── Card 1: Cities ── */}
      <SectionCard>
        <SectionLabel>Cities</SectionLabel>

        {/* Quick picks */}
        <div className="mb-4 flex flex-wrap gap-2">
          {quickPickCities.map((city) => {
            const key = cityKey(city);
            const alreadySelected = selectedKeys.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (alreadySelected) return;
                  addCity({ ...city, iataCode: city.iataCode ?? lookupIata(city.city) });
                  clearError("selectedCities");
                }}
                disabled={alreadySelected}
                className={`border-edge/80 text-navy hover:bg-surface-soft flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors dark:border-white/10 dark:text-white dark:hover:bg-white/10 ${
                  alreadySelected ? "cursor-default opacity-40" : ""
                }`}
              >
                <MapPin className="text-brand-primary h-3.5 w-3.5" />
                {city.city}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div ref={containerRef} className="relative">
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
            className={`${travelInputClass} min-h-[52px] rounded-[14px] pl-11 text-[15px]`}
          />

          {open && results.length > 0 && (
            <div className="border-edge absolute top-[calc(100%+0.375rem)] z-40 w-full overflow-hidden rounded-[16px] border bg-white shadow-[var(--shadow-glass-md)] dark:border-white/10 dark:bg-slate-900">
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
                    className={`border-edge/70 flex w-full items-center justify-between border-b px-4 py-3 text-left last:border-b-0 dark:border-white/8 ${
                      already
                        ? "cursor-default opacity-40"
                        : "hover:bg-surface-hover dark:hover:bg-white/5"
                    }`}
                  >
                    <div>
                      <p className="text-navy text-sm font-semibold dark:text-white">
                        {entry.city}
                      </p>
                      <p className="text-dim mt-0.5 text-xs dark:text-white/40">{entry.country}</p>
                    </div>
                    <MapPin className="text-subtext h-4 w-4 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {citiesError && (
          <p className="text-destructive mt-2 text-sm">
            City catalog failed to load — showing limited suggestions.
          </p>
        )}

        {/* Selected cities */}
        {selectedCities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedCities.map((city, i) => (
              <div
                key={`${cityKey(city)}-${i}`}
                className="border-brand-primary-border bg-brand-primary-soft dark:border-brand-primary/30 dark:bg-brand-primary/10 flex items-center gap-2 rounded-full border py-1.5 pr-2 pl-3"
              >
                <span className="text-brand-primary text-[11px] font-bold">{i + 1}</span>
                <span className="text-navy text-[13px] font-semibold dark:text-white">
                  {city.city}
                </span>
                {city.iataCode && (
                  <span className="text-dim text-[11px] dark:text-white/40">{city.iataCode}</span>
                )}
                <button
                  type="button"
                  onClick={() => removeCity(i)}
                  className="text-dim hover:text-navy ml-0.5 transition-colors dark:text-white/40 dark:hover:text-white"
                  aria-label={`Remove ${city.city}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {errors.selectedCities && (
          <p className={`${travelFieldErrorClass} mt-2`}>{errors.selectedCities}</p>
        )}

        {/* Divider */}
        <div className="border-edge/50 my-5 border-t dark:border-white/8" />
        {/* Trip direction */}
        <SectionLabel>Trip type</SectionLabel>
        <div className="flex gap-2">
          <TogglePill
            active={tripDirection === "return"}
            onClick={() => setTripDirection("return")}
            icon={Repeat}
            label="Return"
          />
          <TogglePill
            active={tripDirection === "one-way"}
            onClick={() => setTripDirection("one-way")}
            icon={ArrowRight}
            label="One-way"
          />
        </div>

        {/* Divider */}
        <div className="border-edge/50 my-4 border-t dark:border-white/8" />

        {/* Date mode */}
        <SectionLabel>Travel dates</SectionLabel>
        <div className="flex gap-2">
          <TogglePill
            active={dateMode === "exact"}
            onClick={() => setDateMode("exact")}
            icon={CalendarDays}
            label="Exact dates"
          />
          <TogglePill
            active={dateMode === "flexible"}
            onClick={() => setDateMode("flexible")}
            icon={Clock}
            label="I'm flexible"
          />
        </div>

        {/* Day count stepper — flexible mode only */}
        {dateMode === "flexible" && (
          <div className="border-edge/60 bg-surface-soft/50 mt-4 rounded-[14px] border px-5 py-3 dark:border-white/8 dark:bg-white/[0.03]">
            <p className="text-faint mb-2 text-center text-[10px] font-bold tracking-[0.18em] uppercase dark:text-white/30">
              How many days?
            </p>
            <div className="flex items-center justify-center gap-5">
              <button
                type="button"
                onClick={() => setDayCount(Math.max(1, dayCount - 1))}
                disabled={dayCount <= 1}
                className="text-brand-primary bg-brand-primary-soft dark:bg-brand-primary/15 flex h-9 w-9 items-center justify-center rounded-xl transition-colors disabled:opacity-30"
              >
                <Minus className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <span className="text-navy min-w-[80px] text-center text-2xl font-bold dark:text-white">
                {dayCount}{" "}
                <span className="text-dim text-sm font-medium dark:text-white/40">days</span>
              </span>
              <button
                type="button"
                onClick={() => setDayCount(Math.min(90, dayCount + 1))}
                disabled={dayCount >= 90}
                className="text-brand-primary bg-brand-primary-soft dark:bg-brand-primary/15 flex h-9 w-9 items-center justify-center rounded-xl transition-colors disabled:opacity-30"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        {/* Date summary */}
        {(dateStart || dateEnd) && (
          <p className="text-navy mt-4 text-center text-sm font-medium dark:text-white">
            {dateStart ? format(parse(dateStart, "yyyy-MM-dd", new Date()), "MMM d, yyyy") : "—"}
            <span className="text-dim mx-2 dark:text-white/30">&rarr;</span>
            {dateEnd ? format(parse(dateEnd, "yyyy-MM-dd", new Date()), "MMM d, yyyy") : "—"}
          </p>
        )}

        {/* Calendar */}
        <div className="mt-3 flex justify-center">
          <DayPicker
            mode="range"
            selected={dateRange}
            onSelect={handleDateRangeSelect}
            defaultMonth={defaultMonth}
            disabled={{ before: new Date() }}
            numberOfMonths={1}
            showOutsideDays
            className="rdp-travel"
          />
        </div>

        {errors.dateStart && <p className={travelFieldErrorClass}>{errors.dateStart}</p>}
        {errors.dateEnd && <p className={travelFieldErrorClass}>{errors.dateEnd}</p>}
      </SectionCard>
    </div>
  );
}
