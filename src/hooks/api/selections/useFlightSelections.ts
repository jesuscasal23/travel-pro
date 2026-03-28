"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";
import type { FlightSelection } from "@/types";

export function useFlightSelections(tripId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.selections.flightsForTrip(tripId),
    queryFn: async () => {
      const res = await apiFetch<{ selections: FlightSelection[] }>(
        `/api/v1/trips/${tripId}/selections/flights`,
        { source: "useFlightSelections", fallbackMessage: "Failed to load flight selections" }
      );
      return res.selections;
    },
    enabled: options?.enabled ?? true,
  });
}
