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
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.selections.flightsForTrip(variables.tripId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.selections.unbookedCount() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.selections.cart() });
    },
  });
}
