"use client";

import { Plane, Train, Bus, ChevronRight, Globe, Thermometer } from "lucide-react";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import type { Itinerary, ItineraryFlightLeg, CityStop, TripDay } from "@/types";

interface PlanSidebarProps {
  itinerary: Itinerary;
  homeAirport: string;
}

/** Extract city name from store value like "FRA – Frankfurt" */
function airportCity(homeAirport: string): string {
  if (!homeAirport) return "";
  const parts = homeAirport.split(/\s*[–—-]\s*/);
  return parts.length > 1 ? parts[1].trim() : homeAirport;
}

/** Derive transport legs from flight legs or travel days */
function deriveTransportLegs(
  route: CityStop[],
  days: TripDay[],
  flightLegs?: ItineraryFlightLeg[],
  homeCity?: string
) {
  // If flight legs exist, use them
  if (flightLegs && flightLegs.length > 0) {
    return flightLegs.map((leg) => ({
      from: leg.fromCity,
      to: leg.toCity,
      duration: leg.duration,
      cost: `€${Math.round(leg.price).toLocaleString()}`,
      mode: "flight" as const,
    }));
  }

  // Otherwise, derive from travel days
  const legs: { from: string; to: string; duration: string; cost: string; mode: "flight" | "train" | "bus" }[] = [];

  // Add home -> first city
  if (homeCity && route.length > 0) {
    legs.push({ from: homeCity, to: route[0].city, duration: "", cost: "", mode: "flight" });
  }

  // Add inter-city travel
  for (const day of days) {
    if (day.isTravel && day.travelFrom && day.travelTo) {
      const durationStr = day.travelDuration ?? "";
      const mode = /train|shinkansen|rail/i.test(durationStr) ? "train" as const
        : /bus/i.test(durationStr) ? "bus" as const
        : "flight" as const;
      legs.push({
        from: day.travelFrom,
        to: day.travelTo,
        duration: durationStr,
        cost: "",
        mode,
      });
    }
  }

  // Add last city -> home
  if (homeCity && route.length > 0) {
    legs.push({ from: route[route.length - 1].city, to: homeCity, duration: "", cost: "", mode: "flight" });
  }

  return legs;
}

const modeIcons = {
  flight: Plane,
  train: Train,
  bus: Bus,
};

export function PlanSidebar({ itinerary, homeAirport }: PlanSidebarProps) {
  const { route, days, visaData, weatherData, flightLegs } = itinerary;

  const countries = [...new Set(route.map((r) => r.country))];
  const totalDays = days.length;
  const totalNights = Math.max(0, totalDays - 1);
  const firstDate = days[0]?.date ?? "";
  const lastDate = days[days.length - 1]?.date ?? "";
  const homeCity = airportCity(homeAirport);

  // Build route chain: home → city1 → city2 → ... → home
  const routeChain = [
    ...(homeCity ? [homeCity] : []),
    ...route.map((r) => r.city),
    ...(homeCity ? [homeCity] : []),
  ];

  const transportLegs = deriveTransportLegs(route, days, flightLegs, homeCity);

  // Group weather by country
  const countryWeather = (weatherData ?? []).length > 0
    ? countries.map((country) => {
        const cities = (weatherData ?? []).filter((w) => {
          const stop = route.find((r) => r.city === w.city);
          return stop?.country === country;
        });
        return { country, cities };
      })
    : [];

  return (
    <div className="space-y-4">
      {/* Trip overview card */}
      <div className="card-travel bg-background">
        <h2 className="font-bold text-foreground text-lg">
          {Math.ceil(totalDays / 7)}-Week {countries.join(" & ")} Trip
        </h2>
        <p className="text-xs text-primary mt-1.5 leading-relaxed">
          {routeChain.join(" → ")}
        </p>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <span>🕐</span> {firstDate} – {lastDate} · {totalNights} nights
        </p>
      </div>

      {/* Route & transport */}
      <CollapsibleSection
        title="Route & transport"
        icon={<Plane className="w-4 h-4" />}
        defaultOpen
      >
        <div className="space-y-1.5 pb-2">
          {transportLegs.map((leg, i) => {
            const Icon = modeIcons[leg.mode];
            return (
              <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="text-primary font-medium">{leg.from}</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="text-primary font-medium">{leg.to}</span>
                {leg.duration && (
                  <span className="text-muted-foreground ml-auto">{leg.duration}</span>
                )}
                {leg.cost && (
                  <span className="font-semibold ml-1">{leg.cost}</span>
                )}
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* Visas & health */}
      <CollapsibleSection
        title="Visas & health"
        icon={<Globe className="w-4 h-4" />}
        defaultOpen
      >
        <div className="space-y-2 pb-2">
          {(!visaData || visaData.length === 0) && (
            <p className="text-xs text-muted-foreground animate-pulse">Loading visa info…</p>
          )}
          {(visaData ?? []).map((visa) => (
            <div key={visa.countryCode} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-secondary px-1.5 py-0.5 rounded">
                  {visa.countryCode}
                </span>
                <span className="font-medium text-foreground">{visa.country}</span>
              </div>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                visa.requirement === "visa-free"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                  : visa.requirement === "e-visa" || visa.requirement === "eta"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
              }`}>
                {visa.label}
              </span>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Weather */}
      <CollapsibleSection
        title="Weather"
        icon={<Thermometer className="w-4 h-4" />}
        defaultOpen
      >
        <div className="space-y-2 pb-2">
          {countryWeather.length === 0 && (
            <p className="text-xs text-muted-foreground animate-pulse">Loading weather…</p>
          )}
          {countryWeather.map(({ country, cities }) => {
            const temps = cities.map((c) => {
              const match = c.temp.match(/(\d+)/);
              return match ? parseInt(match[1]) : 0;
            });
            const minTemp = Math.min(...temps);
            const maxTemp = Math.max(...temps);
            const conditions = [...new Set(cities.map((c) => c.condition))];

            return (
              <div key={country} className="text-xs text-foreground leading-relaxed">
                <span className="font-semibold">{country}</span>
                <span className="text-muted-foreground">
                  {" – "}{conditions.join(", ")} ({minTemp}–{maxTemp}°C)
                </span>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>
    </div>
  );
}
