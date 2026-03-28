"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";

interface RemoveSelectionParams {
  tripId: string;
  selectionId: string;
  type: "flights" | "hotels";
}

export function useRemoveSelection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, selectionId, type }: RemoveSelectionParams) => {
      return apiFetch<{ success: boolean }>(`/api/v1/trips/${tripId}/selections/${type}`, {
        source: "useRemoveSelection",
        method: "DELETE",
        body: { id: selectionId },
        fallbackMessage: "Failed to remove selection",
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
