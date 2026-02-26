import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { queryKeys } from "./keys";
import type { CityWithDays } from "@/lib/flights/types";

interface RouteSelectionParams {
  profile: {
    nationality: string;
    homeAirport: string;
    travelStyle: string;
    interests: string[];
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
  const res = await fetch("/api/generate/select-route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return (data?.cities as CityWithDays[]) ?? null;
}

function buildCacheKey(params: {
  region: string;
  destinationCountry?: string;
  dateStart: string;
  dateEnd: string;
  travelStyle: string;
}): string {
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
