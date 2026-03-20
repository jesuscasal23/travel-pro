import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { apiFetch } from "@/lib/client/api-fetch";
import type { VisaInfo, CityWeather, CityStop, CityAccommodation, TravelStyle } from "@/types";

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

function routeKey(route: CityStop[], options?: { includeStayData?: boolean }): string {
  return route
    .map((r) =>
      options?.includeStayData ? `${r.id}:${r.days}:${r.iataCode ?? ""}:${r.countryCode}` : r.id
    )
    .join(",");
}

// ── Visa enrichment ─────────────────────────────────────────────
async function fetchVisa(nationality: string, route: CityStop[]): Promise<VisaInfo[]> {
  const data = await apiFetch<{ visaData?: VisaInfo[] }>("/api/v1/enrich/visa", {
    source: "useVisaEnrichment",
    method: "POST",
    body: { nationality, route: buildRoutePayload(route) },
    fallbackMessage: "Failed to load visa data",
  });
  return data.visaData ?? [];
}

export function useVisaEnrichment(nationality: string, route: CityStop[], enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.enrichment.visa(nationality, routeKey(route)),
    queryFn: () => fetchVisa(nationality, route),
    enabled: enabled && !!nationality && route.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes — visa data is static
    retry: 1,
  });
}

// ── Weather enrichment ──────────────────────────────────────────
async function fetchWeather(route: CityStop[], dateStart: string): Promise<CityWeather[]> {
  const data = await apiFetch<{ weatherData?: CityWeather[] }>("/api/v1/enrich/weather", {
    source: "useWeatherEnrichment",
    method: "POST",
    body: { route: buildRoutePayload(route), dateStart },
    fallbackMessage: "Failed to load weather data",
  });
  return data.weatherData ?? [];
}

export function useWeatherEnrichment(route: CityStop[], dateStart: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.enrichment.weather(routeKey(route), dateStart),
    queryFn: () => fetchWeather(route, dateStart),
    enabled: enabled && route.length > 0 && !!dateStart,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

// ── Accommodation enrichment ────────────────────────────────
export async function fetchAccommodationEnrichment(
  route: CityStop[],
  dateStart: string,
  travelers: number,
  travelStyle: TravelStyle,
  signal?: AbortSignal
): Promise<CityAccommodation[]> {
  const data = await apiFetch<{ accommodationData?: CityAccommodation[] }>(
    "/api/v1/enrich/accommodation",
    {
      source: "useAccommodationEnrichment",
      method: "POST",
      signal,
      body: {
        route: route.map((r) => ({
          id: r.id,
          city: r.city,
          country: r.country,
          countryCode: r.countryCode,
          lat: r.lat,
          lng: r.lng,
          days: r.days,
          iataCode: r.iataCode,
        })),
        dateStart,
        travelers,
        travelStyle,
      },
      fallbackMessage: "Failed to load accommodation data",
    }
  );
  return data.accommodationData ?? [];
}

export function getAccommodationQueryKey(
  route: CityStop[],
  dateStart: string,
  travelers: number,
  travelStyle: TravelStyle
) {
  return queryKeys.enrichment.accommodation(
    routeKey(route, { includeStayData: true }),
    dateStart,
    travelStyle,
    travelers
  );
}

export function useAccommodationEnrichment(
  route: CityStop[],
  dateStart: string,
  travelers: number,
  travelStyle: TravelStyle,
  enabled: boolean
) {
  return useQuery({
    queryKey: getAccommodationQueryKey(route, dateStart, travelers, travelStyle),
    queryFn: ({ signal }) =>
      fetchAccommodationEnrichment(route, dateStart, travelers, travelStyle, signal),
    enabled: enabled && route.length > 0 && !!dateStart && travelers > 0,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });
}
