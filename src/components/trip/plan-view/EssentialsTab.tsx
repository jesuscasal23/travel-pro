"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ExternalLink,
  Shield,
  Thermometer,
  Backpack,
  Check,
  Loader2,
} from "lucide-react";
import { generatePackingList } from "@/lib/utils/generate-packing-list";
import { shouldHideVisaSection } from "@/lib/utils/visa-utils";
import { NATIONALITY_TO_ISO2 } from "@/data/nationality-to-iso2";
import { useTripStore } from "@/stores/useTripStore";
import type { Itinerary } from "@/types";

interface EssentialsTabProps {
  itinerary: Itinerary;
  visaLoading?: boolean;
  weatherLoading?: boolean;
  visaError?: boolean;
  weatherError?: boolean;
}

function SectionSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="bg-background border-border flex animate-pulse items-center gap-3 rounded-xl border p-4"
        >
          <div className="bg-secondary h-5 w-8 rounded" />
          <div className="bg-secondary h-4 w-24 rounded" />
          <div className="bg-secondary ml-auto h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function LoadingLabel() {
  return (
    <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
      <Loader2 className="h-3 w-3 animate-spin" /> Loading…
    </span>
  );
}

function ErrorLabel() {
  return (
    <span className="text-accent inline-flex items-center gap-1.5 text-xs">
      <AlertTriangle className="h-3 w-3" /> Unavailable
    </span>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="bg-accent/5 border-accent/20 text-foreground flex items-center gap-3 rounded-xl border p-4 text-sm">
      <AlertTriangle className="text-accent h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

export function EssentialsTab({
  itinerary,
  visaLoading,
  weatherLoading,
  visaError,
  weatherError,
}: EssentialsTabProps) {
  const { route, days, visaData, weatherData } = itinerary;

  // Stable localStorage key derived from the route — so each trip has its own packing state
  const packingKey = useMemo(() => `tp-packing-${route.map((c) => c.id).join("-")}`, [route]);

  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // Hydrate from localStorage once on mount (client only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(packingKey);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        if (parsed.length > 0) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCheckedItems(new Set(parsed));
        }
      }
    } catch {
      // Ignore parse errors — start with empty set
    }
  }, [packingKey]);

  const nationality = useTripStore((s) => s.nationality);
  const passportCode =
    NATIONALITY_TO_ISO2[nationality] ??
    (nationality.length === 2 ? nationality.toUpperCase() : undefined);
  const destinationCodes = useMemo(() => [...new Set(route.map((r) => r.countryCode))], [route]);
  const hideVisa = useMemo(
    () => shouldHideVisaSection(visaData, passportCode, destinationCodes),
    [visaData, passportCode, destinationCodes]
  );

  const hasVisa = visaData && visaData.length > 0;
  const hasWeather = weatherData && weatherData.length > 0;

  const packingItems = useMemo(
    () => generatePackingList(weatherData ?? [], visaData ?? [], route, days),
    [weatherData, visaData, route, days]
  );

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(packingKey, JSON.stringify([...next]));
      } catch {
        // Ignore storage errors (e.g. private browsing quota)
      }
      return next;
    });
  };

  // Group weather by country
  const countries = [...new Set(route.map((r) => r.country))];
  const countryWeather = hasWeather
    ? countries.map((country) => {
        const countryRoute = route.filter((r) => r.country === country);
        const cities = weatherData.filter((w) => countryRoute.some((r) => r.city === w.city));
        const temps = cities.map((c) => {
          const match = c.temp.match(/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        });
        const conditions = [...new Set(cities.map((c) => c.condition))];
        return {
          country,
          conditions: conditions.join(", "),
          minTemp: Math.min(...temps),
          maxTemp: Math.max(...temps),
        };
      })
    : [];

  return (
    <div className="space-y-10">
      {/* Visas — hidden when all destinations are own country or Schengen-to-Schengen */}
      {!hideVisa && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-1 flex items-center gap-2">
            <Shield className="text-foreground h-5 w-5" />
            <h2 className="text-foreground text-xl font-bold">Visas</h2>
            {!hasVisa && !visaError && visaLoading && <LoadingLabel />}
            {!hasVisa && visaError && <ErrorLabel />}
          </div>
          <p className="text-muted-foreground mb-4 text-sm">
            Always verify with official embassy sites before travel.
          </p>

          {visaError && !hasVisa ? (
            <ErrorCard message="Visa information couldn't be loaded. Check your nationality in your profile and try refreshing." />
          ) : hasVisa ? (
            <div className="space-y-3">
              {visaData.map((visa) => (
                <div
                  key={visa.countryCode}
                  className="bg-background border-border flex items-center justify-between rounded-xl border p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground bg-secondary rounded px-2 py-1 text-xs font-bold tracking-wider uppercase">
                      {visa.countryCode}
                    </span>
                    <span className="text-foreground font-semibold">{visa.country}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                        visa.requirement === "visa-free"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                          : visa.requirement === "e-visa" || visa.requirement === "eta"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                      }`}
                    >
                      {visa.requirement === "visa-free" && <Check className="h-3 w-3" />}
                      {visa.requirement !== "visa-free" && "⚠"} {visa.label}
                    </span>
                    <a
                      href={visa.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary flex items-center gap-1 text-xs hover:underline"
                    >
                      Official site <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : visaLoading ? (
            <SectionSkeleton lines={countries.length || 3} />
          ) : null}
        </motion.div>
      )}

      {/* Weather & Seasonality */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="mb-4 flex items-center gap-2">
          <Thermometer className="text-foreground h-5 w-5" />
          <h2 className="text-foreground text-xl font-bold">Weather & Seasonality</h2>
          {!hasWeather && !weatherError && weatherLoading && <LoadingLabel />}
          {!hasWeather && weatherError && <ErrorLabel />}
        </div>

        {weatherError && !hasWeather ? (
          <ErrorCard message="Weather data couldn't be loaded. Try refreshing the page." />
        ) : hasWeather ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {countryWeather.map((cw) => (
              <div key={cw.country} className="bg-background border-border rounded-xl border p-4">
                <h3 className="text-foreground font-semibold">{cw.country}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{cw.conditions}</p>
                <p className="text-primary mt-2 text-2xl font-bold">
                  {cw.minTemp}–{cw.maxTemp}°C
                </p>
              </div>
            ))}
          </div>
        ) : weatherLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {countries.map((country) => (
              <div
                key={country}
                className="bg-background border-border animate-pulse rounded-xl border p-4"
              >
                <div className="bg-secondary h-4 w-20 rounded" />
                <div className="bg-secondary mt-2 h-3 w-16 rounded" />
                <div className="bg-secondary mt-2 h-7 w-24 rounded" />
              </div>
            ))}
          </div>
        ) : null}
      </motion.div>

      {/* Smart Packing List */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-4 flex items-center gap-2">
          <Backpack className="text-foreground h-5 w-5" />
          <h2 className="text-foreground text-xl font-bold">Smart Packing List</h2>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {packingItems.map((item) => (
            <label
              key={item.id}
              className="bg-background border-border hover:bg-secondary/30 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
            >
              <input
                type="checkbox"
                checked={checkedItems.has(item.id)}
                onChange={() => toggleItem(item.id)}
                className="border-border text-primary focus:ring-primary accent-primary h-4 w-4 rounded"
              />
              <span
                className={`text-sm ${
                  checkedItems.has(item.id)
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                }`}
              >
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
