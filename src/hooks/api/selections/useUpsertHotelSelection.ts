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
    onSuccess: (data, variables) => {
      // Immediately update trip-scoped hotel selections with the server-returned selection
      queryClient.setQueryData<HotelSelection[]>(
        queryKeys.selections.hotelsForTrip(variables.tripId),
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
