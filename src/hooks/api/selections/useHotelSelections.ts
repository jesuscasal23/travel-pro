"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";
import type { HotelSelection } from "@/types";

export function useHotelSelections(tripId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.selections.hotelsForTrip(tripId),
    queryFn: async () => {
      const res = await apiFetch<{ selections: HotelSelection[] }>(
        `/api/v1/trips/${tripId}/selections/hotels`,
        { source: "useHotelSelections", fallbackMessage: "Failed to load hotel selections" }
      );
      return res.selections;
    },
    enabled: options?.enabled ?? true,
  });
}
