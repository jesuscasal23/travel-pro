"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";
import type { BookingClick } from "@/types";

interface ConfirmBookingParams {
  tripId: string;
  clickId: string;
  confirmed: boolean;
}

export function useConfirmBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, clickId, confirmed }: ConfirmBookingParams) => {
      return apiFetch<{ click: BookingClick }>(`/api/v1/trips/${tripId}/booking-clicks`, {
        source: "useConfirmBooking",
        method: "PATCH",
        body: { clickId, confirmed },
        fallbackMessage: "Failed to update booking status",
      });
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.bookingClicks.forTrip(variables.tripId),
      });
    },
  });
}
