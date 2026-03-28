"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";

interface MarkBookedParams {
  tripId: string;
  selectionId: string;
  type: "flights" | "hotels";
}

export function useMarkSelectionBooked() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, selectionId, type }: MarkBookedParams) => {
      return apiFetch(`/api/v1/trips/${tripId}/selections/${type}`, {
        source: "useMarkSelectionBooked",
        method: "PATCH",
        body: { id: selectionId },
        fallbackMessage: "Failed to mark as booked",
      });
    },
    onSuccess: (_data, variables) => {
      const key =
        variables.type === "flights"
          ? queryKeys.selections.flightsForTrip(variables.tripId)
          : queryKeys.selections.hotelsForTrip(variables.tripId);
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: queryKeys.selections.unbookedCount() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.selections.cart() });
    },
  });
}
