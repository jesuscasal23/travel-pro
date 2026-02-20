import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import type { Itinerary, TripType } from "@/types";

// ── Create Trip ─────────────────────────────────────────────────
interface CreateTripParams {
  tripType: TripType;
  region: string;
  destination?: string;
  destinationCountry?: string;
  destinationCountryCode?: string;
  dateStart: string;
  dateEnd: string;
  flexibleDates: boolean;
  budget: number;
  travelers: number;
}

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateTripParams): Promise<{ trip: { id: string } }> => {
      const res = await fetch("/api/v1/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error("Failed to create trip");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
    },
  });
}

// ── Save Trip Edits ─────────────────────────────────────────────
interface SaveEditParams {
  tripId: string;
  editType: string;
  editPayload: object;
  description: string;
  data: Itinerary;
}

export function useSaveTripEdit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, ...body }: SaveEditParams) => {
      const res = await fetch(`/api/v1/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(variables.tripId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.list() });
    },
  });
}

// ── Generate Share Link ─────────────────────────────────────────
interface ShareResult {
  shareToken: string;
  shareUrl: string;
}

export function useShareTrip() {
  return useMutation({
    mutationFn: async (tripId: string): Promise<ShareResult> => {
      const res = await fetch(`/api/v1/trips/${tripId}/share`);
      if (!res.ok) throw new Error("Failed to generate share link");
      return res.json();
    },
  });
}
