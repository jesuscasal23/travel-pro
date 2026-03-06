"use client";

import { useMemo } from "react";
import { Plane } from "lucide-react";
import { FlightOptionsPanel } from "@/components/trip/FlightOptionsPanel";
import { useTripStore } from "@/stores/useTripStore";
import type { Itinerary } from "@/types";
import type { FlightLegResults } from "@/lib/flights/types";

interface FlightsTabProps {
  itinerary: Itinerary;
  tripId: string;
}

/** Extract IATA code from store value like "FRA - Frankfurt" */
function extractIata(homeAirport: string): string {
  if (!homeAirport) return "";
  return homeAirport.split(/\s*[–—-]\s*/)[0].trim();
}

/** Add N days to a YYYY-MM-DD date string */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function FlightsTab({ itinerary, tripId }: FlightsTabProps) {
  const homeAirport = useTripStore((s) => s.homeAirport);
  const travelers = useTripStore((s) => s.travelers) || 1;
  const dateStart = useTripStore((s) => s.dateStart);

  const { route, flightOptions, flightLegs } = itinerary;
  const homeIata = extractIata(homeAirport);

  // Build FlightLegResults[] from whatever data is available
  const legs: FlightLegResults[] = useMemo(() => {
    // If we already have multi-result flight options, use them directly
    if (flightOptions && flightOptions.length > 0) return flightOptions;

    // Otherwise derive legs from route + flightLegs or just the route
    const derived: FlightLegResults[] = [];
    let runningDate = dateStart;

    // Outbound: home -> first city
    if (homeIata && route.length > 0 && route[0].iataCode) {
      const depDate = runningDate || "";
      const existing = flightLegs?.find(
        (l) => l.fromIata === homeIata && l.toIata === route[0].iataCode
      );
      derived.push({
        fromIata: homeIata,
        toIata: route[0].iataCode!,
        departureDate: existing?.departureDate || depDate,
        results: existing
          ? [
              {
                price: existing.price,
                duration: existing.duration,
                airline: existing.airline,
                stops: 0,
                departureTime: "",
                arrivalTime: "",
                cabin: "ECONOMY",
                bookingUrl: "",
              },
            ]
          : [],
        fetchedAt: 0,
      });
    }

    // Inter-city legs
    for (let i = 0; i < route.length - 1; i++) {
      const from = route[i];
      const to = route[i + 1];
      if (!from.iataCode || !to.iataCode) continue;

      if (runningDate) runningDate = addDays(runningDate, from.days);

      const existing = flightLegs?.find(
        (l) => l.fromIata === from.iataCode && l.toIata === to.iataCode
      );
      derived.push({
        fromIata: from.iataCode,
        toIata: to.iataCode,
        departureDate: existing?.departureDate || runningDate || "",
        results: existing
          ? [
              {
                price: existing.price,
                duration: existing.duration,
                airline: existing.airline,
                stops: 0,
                departureTime: "",
                arrivalTime: "",
                cabin: "ECONOMY",
                bookingUrl: "",
              },
            ]
          : [],
        fetchedAt: 0,
      });
    }

    // Return: last city -> home
    if (homeIata && route.length > 0 && route[route.length - 1].iataCode) {
      const lastCity = route[route.length - 1];
      if (runningDate) runningDate = addDays(runningDate, lastCity.days);

      const existing = flightLegs?.find(
        (l) => l.fromIata === lastCity.iataCode && l.toIata === homeIata
      );
      derived.push({
        fromIata: lastCity.iataCode!,
        toIata: homeIata,
        departureDate: existing?.departureDate || runningDate || "",
        results: existing
          ? [
              {
                price: existing.price,
                duration: existing.duration,
                airline: existing.airline,
                stops: 0,
                departureTime: "",
                arrivalTime: "",
                cabin: "ECONOMY",
                bookingUrl: "",
              },
            ]
          : [],
        fetchedAt: 0,
      });
    }

    return derived;
  }, [route, flightOptions, flightLegs, homeIata, dateStart]);

  if (legs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Plane className="text-muted-foreground mb-3 h-10 w-10" />
        <p className="text-foreground font-medium">No flight legs available</p>
        <p className="text-muted-foreground mt-1 text-sm">
          {!homeAirport
            ? "Set your home airport in your profile to see flight options."
            : "Flight information will appear once your itinerary has cities with airport codes."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-lg font-semibold">Flight Options</h2>
        <span className="text-muted-foreground text-xs">
          {legs.length} leg{legs.length !== 1 ? "s" : ""}
        </span>
      </div>
      {legs.map((leg, i) => (
        <FlightOptionsPanel
          key={`${leg.fromIata}-${leg.toIata}-${i}`}
          leg={leg}
          tripId={tripId}
          travelers={travelers}
          itineraryId={tripId}
        />
      ))}
    </div>
  );
}
