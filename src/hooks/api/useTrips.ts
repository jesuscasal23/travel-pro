import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import type { TripSummary } from "@/types";

async function fetchTrips(): Promise<TripSummary[]> {
  const res = await fetch("/api/v1/trips");
  if (!res.ok) throw new Error("Failed to load trips");
  const data = await res.json();
  return data.trips ?? [];
}

export function useTrips() {
  return useQuery({
    queryKey: queryKeys.trips.list(),
    queryFn: fetchTrips,
  });
}
