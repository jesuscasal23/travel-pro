import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";
import type {
  CityAccommodation,
  CityStop,
  CityWeather,
  HealthInfo,
  TravelStyle,
  VisaInfo,
} from "@/types";

// ── Route helpers ──────────────────────────────────────────────

function buildRoutePayload(route: CityStop[]) {
  return route.map((r) => ({
    id: r.id,
    city: r.city,
    country: r.country,
    countryCode: r.countryCode,
    lat: r.lat,
    lng: r.lng,
    days: r.days,
    iataCode: r.iataCode,
  }));
}

export function routeKey(route: CityStop[], options?: { includeStayData?: boolean }): string {
  return route
    .map((r) =>
      options?.includeStayData ? `${r.id}:${r.days}:${r.iataCode ?? ""}:${r.countryCode}` : r.id
    )
    .join(",");
}

// ── Shared enrichment query wrapper ────────────────────────────

const ENRICHMENT_DEFAULTS = { staleTime: 10 * 60 * 1000, retry: 1 } as const;

interface EnrichmentQueryConfig<T> {
  queryKey: readonly unknown[];
  queryFn: (signal?: AbortSignal) => Promise<T>;
  enabled: boolean;
  staleTime?: number;
}

/**
 * Thin wrapper around useQuery with consistent enrichment defaults
 * (retry: 1, 10-min staleTime). Override staleTime per-hook as needed.
 */
export function useEnrichmentQuery<T>({
  queryKey,
  queryFn,
  enabled,
  staleTime = ENRICHMENT_DEFAULTS.staleTime,
}: EnrichmentQueryConfig<T>): UseQueryResult<T> {
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => queryFn(signal),
    enabled,
    staleTime,
    retry: ENRICHMENT_DEFAULTS.retry,
  });
}

// ── Fetch functions ────────────────────────────────────────────

export async function fetchVisaEnrichment(
  nationality: string,
  route: CityStop[]
): Promise<VisaInfo[]> {
  const data = await apiFetch<{ visaData?: VisaInfo[] }>("/api/v1/enrich/visa", {
    source: "useVisaEnrichment",
    method: "POST",
    body: { nationality, route: buildRoutePayload(route) },
    fallbackMessage: "Failed to load visa data",
  });
  return data.visaData ?? [];
}

export async function fetchHealthEnrichment(route: CityStop[]): Promise<HealthInfo[]> {
  const data = await apiFetch<{ healthData?: HealthInfo[] }>("/api/v1/enrich/health", {
    source: "useHealthEnrichment",
    method: "POST",
    body: { route: buildRoutePayload(route) },
    fallbackMessage: "Failed to load health data",
  });
  return data.healthData ?? [];
}

export async function fetchWeatherEnrichment(
  route: CityStop[],
  dateStart: string
): Promise<CityWeather[]> {
  const data = await apiFetch<{ weatherData?: CityWeather[] }>("/api/v1/enrich/weather", {
    source: "useWeatherEnrichment",
    method: "POST",
    body: { route: buildRoutePayload(route), dateStart },
    fallbackMessage: "Failed to load weather data",
  });
  return data.weatherData ?? [];
}

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
        route: buildRoutePayload(route),
        dateStart,
        travelers,
        travelStyle,
      },
      fallbackMessage: "Failed to load accommodation data",
    }
  );
  return data.accommodationData ?? [];
}

// ── Query key helpers ──────────────────────────────────────────

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
