"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";
import type { CartTrip, FlightSelection, HotelSelection } from "@/types";

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
    onMutate: async (variables) => {
      const tripSelectionsKey =
        variables.type === "flights"
          ? queryKeys.selections.flightsForTrip(variables.tripId)
          : queryKeys.selections.hotelsForTrip(variables.tripId);
      const cartKey = queryKeys.selections.cart();
      const countKey = queryKeys.selections.unbookedCount();

      await queryClient.cancelQueries({ queryKey: tripSelectionsKey });
      await queryClient.cancelQueries({ queryKey: cartKey });
      await queryClient.cancelQueries({ queryKey: countKey });

      const prevTripSelections =
        variables.type === "flights"
          ? queryClient.getQueryData<FlightSelection[]>(tripSelectionsKey)
          : queryClient.getQueryData<HotelSelection[]>(tripSelectionsKey);
      const prevCart = queryClient.getQueryData<CartTrip[]>(cartKey);
      const prevCount = queryClient.getQueryData<number>(countKey);

      // Remove from trip-scoped selections
      if (variables.type === "flights") {
        queryClient.setQueryData<FlightSelection[]>(tripSelectionsKey, (old) =>
          old?.filter((s) => s.id !== variables.selectionId)
        );
      } else {
        queryClient.setQueryData<HotelSelection[]>(tripSelectionsKey, (old) =>
          old?.filter((s) => s.id !== variables.selectionId)
        );
      }

      // Remove from cart and drop empty trip groups
      queryClient.setQueryData<CartTrip[]>(cartKey, (old) => {
        if (!old) return old;
        const field = variables.type === "flights" ? "flights" : "hotels";
        return old
          .map((trip) => {
            if (trip.tripId !== variables.tripId) return trip;
            return {
              ...trip,
              [field]: (trip[field] as { id: string }[]).filter(
                (s) => s.id !== variables.selectionId
              ),
            };
          })
          .filter((trip) => trip.flights.length > 0 || trip.hotels.length > 0);
      });

      // Decrement unbooked count
      queryClient.setQueryData<number>(countKey, (old) =>
        old != null ? Math.max(0, old - 1) : old
      );

      return { prevTripSelections, prevCart, prevCount, tripSelectionsKey };
    },
    onError: (_err, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData(context.tripSelectionsKey, context.prevTripSelections);
      queryClient.setQueryData(queryKeys.selections.cart(), context.prevCart);
      queryClient.setQueryData(queryKeys.selections.unbookedCount(), context.prevCount);
    },
    onSettled: (_data, _error, variables) => {
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
