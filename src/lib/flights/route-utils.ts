import { lookupIata } from "@/lib/flights/city-iata-map";
import type { CityWithDays } from "@/lib/flights/types";
import type { CityStop } from "@/types";

export interface FlightRouteLeg {
  fromIata: string;
  toIata: string;
  departureDate: string;
}

export type RouteStopWithIata = CityStop & { iataCode: string };

function resolveStopIata(stop: CityStop): string | undefined {
  return stop.iataCode ?? lookupIata(stop.city);
}

export function buildFlightLegsFromRoute(
  route: CityStop[],
  dateStart: string,
  dateEnd: string,
  homeIata: string
): FlightRouteLeg[] {
  const legs: FlightRouteLeg[] = [];

  if (route.length === 0) return legs;

  const firstIata = resolveStopIata(route[0]);
  if (homeIata && firstIata) {
    legs.push({ fromIata: homeIata, toIata: firstIata, departureDate: dateStart });
  }

  let dayOffset = 0;
  for (let i = 0; i < route.length - 1; i++) {
    dayOffset += route[i].days;
    const fromIata = resolveStopIata(route[i]);
    const toIata = resolveStopIata(route[i + 1]);
    if (fromIata && toIata) {
      const departureDate = new Date(dateStart);
      departureDate.setDate(departureDate.getDate() + dayOffset);
      legs.push({
        fromIata,
        toIata,
        departureDate: departureDate.toISOString().slice(0, 10),
      });
    }
  }

  const lastIata = resolveStopIata(route[route.length - 1]);
  if (homeIata && lastIata) {
    legs.push({ fromIata: lastIata, toIata: homeIata, departureDate: dateEnd });
  }

  return legs;
}

export function resolveRouteIataCodes(route: CityStop[]): {
  resolvedRoute: RouteStopWithIata[];
  missingCities: string[];
} {
  const resolvedRoute: RouteStopWithIata[] = [];
  const missingCities: string[] = [];

  for (const stop of route) {
    const iataCode = resolveStopIata(stop);
    if (!iataCode) {
      missingCities.push(stop.city);
      continue;
    }
    resolvedRoute.push({ ...stop, iataCode });
  }

  return { resolvedRoute, missingCities };
}

export function buildOptimizerCities(route: RouteStopWithIata[]): CityWithDays[] {
  return route.map((stop) => ({
    id: stop.id,
    city: stop.city,
    country: stop.country,
    countryCode: stop.countryCode,
    iataCode: stop.iataCode,
    lat: stop.lat,
    lng: stop.lng,
    minDays: Math.max(1, stop.days - 1),
    maxDays: stop.days + 1,
  }));
}
