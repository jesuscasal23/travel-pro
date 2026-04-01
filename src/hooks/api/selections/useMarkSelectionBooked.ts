"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";
import type { CartTrip, FlightSelection, HotelSelection } from "@/types";

interface MarkBookedParams {
  tripId: string;
  selectionId: string;
  type: "flights" | "hotels";
  booked?: boolean;
}

export function useMarkSelectionBooked() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, selectionId, type, booked = true }: MarkBookedParams) => {
      return apiFetch(`/api/v1/trips/${tripId}/selections/${type}`, {
        source: "useMarkSelectionBooked",
        method: "PATCH",
        body: { id: selectionId, booked },
        fallbackMessage: "Failed to mark as booked",
      });
    },
    onMutate: async (variables) => {
      const { tripId, selectionId, type, booked = true } = variables;
      const tripSelectionsKey =
        type === "flights"
          ? queryKeys.selections.flightsForTrip(tripId)
          : queryKeys.selections.hotelsForTrip(tripId);
      const cartKey = queryKeys.selections.cart();
      const countKey = queryKeys.selections.unbookedCount();

      await queryClient.cancelQueries({ queryKey: tripSelectionsKey });
      await queryClient.cancelQueries({ queryKey: cartKey });
      await queryClient.cancelQueries({ queryKey: countKey });

      const prevTripSelections =
        type === "flights"
          ? queryClient.getQueryData<FlightSelection[]>(tripSelectionsKey)
          : queryClient.getQueryData<HotelSelection[]>(tripSelectionsKey);
      const prevCart = queryClient.getQueryData<CartTrip[]>(cartKey);
      const prevCount = queryClient.getQueryData<number>(countKey);

      const bookedAt = booked ? new Date().toISOString() : null;

      // Update in trip-scoped selections
      if (type === "flights") {
        queryClient.setQueryData<FlightSelection[]>(tripSelectionsKey, (old) =>
          old?.map((s) => (s.id === selectionId ? { ...s, booked, bookedAt } : s))
        );
      } else {
        queryClient.setQueryData<HotelSelection[]>(tripSelectionsKey, (old) =>
          old?.map((s) => (s.id === selectionId ? { ...s, booked, bookedAt } : s))
        );
      }

      // Update in-place in cart (keep item, flip the booked flag)
      queryClient.setQueryData<CartTrip[]>(cartKey, (old) => {
        if (!old) return old;
        const field = type === "flights" ? "flights" : "hotels";
        return old.map((trip) => {
          if (trip.tripId !== tripId) return trip;
          return {
            ...trip,
            [field]: (trip[field] as (FlightSelection | HotelSelection)[]).map((s) =>
              s.id === selectionId ? { ...s, booked, bookedAt } : s
            ),
          };
        });
      });

      // Adjust unbooked count: marking booked → decrement, un-marking → increment
      queryClient.setQueryData<number>(countKey, (old) => {
        if (old == null) return old;
        return booked ? Math.max(0, old - 1) : old + 1;
      });

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
