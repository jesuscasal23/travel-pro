import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { apiFetch } from "@/lib/client/api-fetch";
import type { TripSummary } from "@/types";

async function fetchTrips(): Promise<TripSummary[]> {
  const data = await apiFetch<{ trips?: TripSummary[] }>("/api/v1/trips", {
    source: "useTrips",
    fallbackMessage: "Failed to load trips",
  });
  return data.trips ?? [];
}

export function useTrips() {
  return useQuery({
    queryKey: queryKeys.trips.list(),
    queryFn: fetchTrips,
  });
}
