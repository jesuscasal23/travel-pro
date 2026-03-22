"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";
import type { BookingClick } from "@/types";

interface ManualBookingParams {
  tripId: string;
  clickType: "flight" | "hotel";
  city?: string;
  metadata?: Record<string, unknown>;
}

export function useManualBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, clickType, city, metadata }: ManualBookingParams) => {
      return apiFetch<{ click: BookingClick }>(`/api/v1/trips/${tripId}/booking-clicks`, {
        source: "useManualBooking",
        method: "POST",
        body: { clickType, city, metadata },
        fallbackMessage: "Failed to mark as booked",
      });
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.bookingClicks.forTrip(variables.tripId),
      });
    },
  });
}
