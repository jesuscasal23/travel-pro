import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import type { VisaInfo, CityWeather, CityStop } from "@/types";

interface RoutePayload {
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
}

function buildRoutePayload(route: CityStop[]): RoutePayload[] {
  return route.map((r) => ({
    city: r.city,
    country: r.country,
    countryCode: r.countryCode,
    lat: r.lat,
    lng: r.lng,
  }));
}

function routeKey(route: CityStop[]): string {
  return route.map((r) => r.id).join(",");
}

// ── Visa enrichment ─────────────────────────────────────────────
async function fetchVisa(nationality: string, route: CityStop[]): Promise<VisaInfo[]> {
  const res = await fetch("/api/v1/enrich/visa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nationality, route: buildRoutePayload(route) }),
  });
  if (!res.ok) return [];
  const { visaData } = await res.json();
  return visaData ?? [];
}

export function useVisaEnrichment(nationality: string, route: CityStop[], enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.enrichment.visa(nationality, routeKey(route)),
    queryFn: () => fetchVisa(nationality, route),
    enabled: enabled && !!nationality && route.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes — visa data is static
  });
}

// ── Weather enrichment ──────────────────────────────────────────
async function fetchWeather(route: CityStop[], dateStart: string): Promise<CityWeather[]> {
  const res = await fetch("/api/v1/enrich/weather", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ route: buildRoutePayload(route), dateStart }),
  });
  if (!res.ok) return [];
  const { weatherData } = await res.json();
  return weatherData ?? [];
}

export function useWeatherEnrichment(route: CityStop[], dateStart: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.enrichment.weather(routeKey(route), dateStart),
    queryFn: () => fetchWeather(route, dateStart),
    enabled: enabled && route.length > 0 && !!dateStart,
    staleTime: 10 * 60 * 1000,
  });
}
