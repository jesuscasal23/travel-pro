"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";
import type { BookingClick } from "@/types";

interface BookingClicksResponse {
  clicks: BookingClick[];
}

async function fetchBookingClicks(tripId: string): Promise<BookingClick[]> {
  const res = await apiFetch<BookingClicksResponse>(`/api/v1/trips/${tripId}/booking-clicks`, {
    source: "useBookingClicks",
    fallbackMessage: "Failed to load booking clicks",
  });
  return res.clicks;
}

export function useBookingClicks(tripId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.bookingClicks.forTrip(tripId),
    queryFn: () => fetchBookingClicks(tripId),
    enabled: options?.enabled ?? true,
  });
}
