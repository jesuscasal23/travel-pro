"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";
import type { HotelSelection } from "@/types";

interface UpsertHotelParams {
  tripId: string;
  body: Record<string, unknown>;
}

export function useUpsertHotelSelection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, body }: UpsertHotelParams) => {
      return apiFetch<{ selection: HotelSelection }>(`/api/v1/trips/${tripId}/selections/hotels`, {
        source: "useUpsertHotelSelection",
        method: "PUT",
        body,
        fallbackMessage: "Failed to save hotel selection",
      });
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.selections.hotelsForTrip(variables.tripId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.selections.unbookedCount() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.selections.cart() });
    },
  });
}
