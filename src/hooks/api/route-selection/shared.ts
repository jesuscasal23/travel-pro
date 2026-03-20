import { apiFetch } from "@/lib/client/api-fetch";
import type { CityWithDays } from "@/lib/flights/types";
import type { ActivityPace } from "@/types";

export interface RouteSelectionParams {
  profile: {
    nationality: string;
    homeAirport: string;
    travelStyle: string;
    interests: string[];
    pace?: ActivityPace;
  };
  tripIntent: {
    id: string;
    tripType: string;
    region: string;
    destinationCountry?: string;
    destinationCountryCode?: string;
    dateStart: string;
    dateEnd: string;
    travelers: number;
  };
}

export async function fetchRouteSelection(
  params: RouteSelectionParams
): Promise<CityWithDays[] | null> {
  try {
    const data = await apiFetch<{ cities?: CityWithDays[] }>("/api/generate/select-route", {
      source: "useRouteSelection",
      method: "POST",
      body: params,
      fallbackMessage: "Route selection failed",
    });
    return data.cities ?? null;
  } catch {
    return null;
  }
}

export function buildCacheKey(params: RouteSelectionParams): string {
  return JSON.stringify(params);
}
