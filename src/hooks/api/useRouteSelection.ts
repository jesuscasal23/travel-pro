import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { queryKeys } from "./keys";
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

async function fetchRouteSelection(params: RouteSelectionParams): Promise<CityWithDays[] | null> {
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

function buildCacheKey(params: RouteSelectionParams): string {
  return JSON.stringify(params);
}

/** Prefetch route selection into React Query cache (fire-and-forget). */
export function usePrefetchRouteSelection() {
  const queryClient = useQueryClient();

  return useCallback(
    (params: RouteSelectionParams, cacheKey: string) => {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.routeSelection.byParams(cacheKey),
        queryFn: () => fetchRouteSelection(params),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient]
  );
}

/** Fetch route selection, using cached result if available. */
export function useFetchRouteSelection() {
  const queryClient = useQueryClient();

  return useCallback(
    async (params: RouteSelectionParams, cacheKey: string): Promise<CityWithDays[] | null> => {
      return queryClient.fetchQuery({
        queryKey: queryKeys.routeSelection.byParams(cacheKey),
        queryFn: () => fetchRouteSelection(params),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient]
  );
}

export { buildCacheKey };
