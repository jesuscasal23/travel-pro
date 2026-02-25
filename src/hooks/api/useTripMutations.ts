import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { useTripStore } from "@/stores/useTripStore";
import { parseApiErrorResponse, reportApiError } from "@/lib/client/api-error-reporting";
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
  flexibleDates?: boolean;
  travelers: number;
  description?: string;
}

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateTripParams): Promise<{ trip: { id: string } }> => {
      let res: Response;
      try {
        res = await fetch("/api/v1/trips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
      } catch (error) {
        await reportApiError({
          source: "useCreateTrip",
          endpoint: "/api/v1/trips",
          method: "POST",
          message: error instanceof Error ? error.message : "Network error while creating trip",
        });
        throw new Error("Failed to create trip");
      }

      if (!res.ok) {
        const parsed = await parseApiErrorResponse(res, "Failed to create trip");
        await reportApiError({
          source: "useCreateTrip",
          endpoint: "/api/v1/trips",
          method: "POST",
          message: parsed.message,
          status: parsed.status,
          requestId: parsed.requestId,
          responseBody: parsed.responseBody,
        });
        throw new Error(parsed.message);
      }
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
  return useMutation({
    mutationFn: async ({ tripId, ...body }: SaveEditParams) => {
      const endpoint = `/api/v1/trips/${tripId}`;
      let res: Response;
      try {
        res = await fetch(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch (error) {
        await reportApiError({
          source: "useSaveTripEdit",
          endpoint,
          method: "PATCH",
          message: error instanceof Error ? error.message : "Network error while saving trip",
        });
        throw new Error("Save failed");
      }

      if (!res.ok) {
        const parsed = await parseApiErrorResponse(res, "Save failed");
        await reportApiError({
          source: "useSaveTripEdit",
          endpoint,
          method: "PATCH",
          message: parsed.message,
          status: parsed.status,
          requestId: parsed.requestId,
          responseBody: parsed.responseBody,
        });
        throw new Error(parsed.message);
      }
      return res.json();
    },
    onMutate: () => {
      // Snapshot current itinerary for rollback (fires synchronously before async mutation)
      return { previousItinerary: useTripStore.getState().itinerary };
    },
    meta: {
      errorToast: "Your trip edits couldn't be saved. They may be lost on refresh.",
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
      const endpoint = `/api/v1/trips/${tripId}/share`;
      let res: Response;
      try {
        res = await fetch(endpoint);
      } catch (error) {
        await reportApiError({
          source: "useShareTrip",
          endpoint,
          method: "GET",
          message: error instanceof Error ? error.message : "Network error while generating share link",
        });
        throw new Error("Failed to generate share link");
      }

      if (!res.ok) {
        const parsed = await parseApiErrorResponse(res, "Failed to generate share link");
        await reportApiError({
          source: "useShareTrip",
          endpoint,
          method: "GET",
          message: parsed.message,
          status: parsed.status,
          requestId: parsed.requestId,
          responseBody: parsed.responseBody,
        });
        throw new Error(parsed.message);
      }
      return res.json();
    },
  });
}
