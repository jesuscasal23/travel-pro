"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";
import type { FlightSelection } from "@/types";

interface UpsertFlightParams {
  tripId: string;
  body: Record<string, unknown>;
}

export function useUpsertFlightSelection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, body }: UpsertFlightParams) => {
      return apiFetch<{ selection: FlightSelection }>(
        `/api/v1/trips/${tripId}/selections/flights`,
        {
          source: "useUpsertFlightSelection",
          method: "PUT",
          body,
          fallbackMessage: "Failed to save flight selection",
        }
      );
    },
    onSuccess: (data, variables) => {
      // Immediately update trip-scoped flight selections with the server-returned selection
      queryClient.setQueryData<FlightSelection[]>(
        queryKeys.selections.flightsForTrip(variables.tripId),
        (old) => {
          if (!old) return [data.selection];
          const idx = old.findIndex((s) => s.id === data.selection.id);
          if (idx >= 0) {
            return old.map((s, i) => (i === idx ? data.selection : s));
          }
          return [...old, data.selection];
        }
      );
      // Background-refresh cart and unbooked count
      void queryClient.invalidateQueries({ queryKey: queryKeys.selections.unbookedCount() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.selections.cart() });
    },
  });
}
