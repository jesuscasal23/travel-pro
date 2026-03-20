import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";
import type { CityAccommodation, CityStop, TravelStyle } from "@/types";

interface RoutePayload {
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
}

export function buildRoutePayload(route: CityStop[]): RoutePayload[] {
  return route.map((r) => ({
    city: r.city,
    country: r.country,
    countryCode: r.countryCode,
    lat: r.lat,
    lng: r.lng,
  }));
}

export function routeKey(route: CityStop[], options?: { includeStayData?: boolean }): string {
  return route
    .map((r) =>
      options?.includeStayData ? `${r.id}:${r.days}:${r.iataCode ?? ""}:${r.countryCode}` : r.id
    )
    .join(",");
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
