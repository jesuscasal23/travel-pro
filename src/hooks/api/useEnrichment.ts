import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { parseApiErrorResponse, reportApiError } from "@/lib/client/api-error-reporting";
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

function routeKey(route: CityStop[]): string {
  return route.map((r) => r.id).join(",");
}

// ── Visa enrichment ─────────────────────────────────────────────
async function fetchVisa(nationality: string, route: CityStop[]): Promise<VisaInfo[]> {
  const endpoint = "/api/v1/enrich/visa";
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nationality, route: buildRoutePayload(route) }),
    });
  } catch (error) {
    await reportApiError({
      source: "useVisaEnrichment",
      endpoint,
      method: "POST",
      message: error instanceof Error ? error.message : "Network error while loading visa data",
    });
    throw new Error("Failed to load visa data");
  }
  if (!res.ok) {
    const parsed = await parseApiErrorResponse(res, "Failed to load visa data");
    await reportApiError({
      source: "useVisaEnrichment",
      endpoint,
      method: "POST",
      message: parsed.message,
      status: parsed.status,
      requestId: parsed.requestId,
      responseBody: parsed.responseBody,
    });
    throw new Error(parsed.message);
  }
  const { visaData } = await res.json();
  return visaData ?? [];
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
  const endpoint = "/api/v1/enrich/weather";
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ route: buildRoutePayload(route), dateStart }),
    });
  } catch (error) {
    await reportApiError({
      source: "useWeatherEnrichment",
      endpoint,
      method: "POST",
      message: error instanceof Error ? error.message : "Network error while loading weather data",
    });
    throw new Error("Failed to load weather data");
  }
  if (!res.ok) {
    const parsed = await parseApiErrorResponse(res, "Failed to load weather data");
    await reportApiError({
      source: "useWeatherEnrichment",
      endpoint,
      method: "POST",
      message: parsed.message,
      status: parsed.status,
      requestId: parsed.requestId,
      responseBody: parsed.responseBody,
    });
    throw new Error(parsed.message);
  }
  const { weatherData } = await res.json();
  return weatherData ?? [];
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
async function fetchAccommodation(
  route: CityStop[],
  dateStart: string,
  travelers: number,
  travelStyle: TravelStyle
): Promise<CityAccommodation[]> {
  const endpoint = "/api/v1/enrich/accommodation";
  const payload = {
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
  };

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    await reportApiError({
      source: "useAccommodationEnrichment",
      endpoint,
      method: "POST",
      message:
        error instanceof Error ? error.message : "Network error while loading accommodation data",
    });
    throw new Error("Failed to load accommodation data");
  }
  if (!res.ok) {
    const parsed = await parseApiErrorResponse(res, "Failed to load accommodation data");
    await reportApiError({
      source: "useAccommodationEnrichment",
      endpoint,
      method: "POST",
      message: parsed.message,
      status: parsed.status,
      requestId: parsed.requestId,
      responseBody: parsed.responseBody,
    });
    throw new Error(parsed.message);
  }
  const { accommodationData } = await res.json();
  return accommodationData ?? [];
}

export function useAccommodationEnrichment(
  route: CityStop[],
  dateStart: string,
  travelers: number,
  travelStyle: TravelStyle,
  enabled: boolean
) {
  return useQuery({
    queryKey: queryKeys.enrichment.accommodation(routeKey(route), dateStart, travelStyle),
    queryFn: () => fetchAccommodation(route, dateStart, travelers, travelStyle),
    enabled: enabled && route.length > 0 && !!dateStart && travelers > 0,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });
}
