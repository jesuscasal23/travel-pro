import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { parseItineraryData } from "@/lib/utils/trip/trip-metadata";
import { apiFetchRaw } from "@/lib/client/api-fetch";
import { reportApiError } from "@/lib/client/api-error-reporting";
import { consumeSSEStream } from "@/lib/client/sse-parser";
import type { Itinerary } from "@/types";
import { fetchTrip } from "./shared";

interface GenerateParams {
  tripId: string;
  profile?: {
    nationality: string;
    homeAirport: string;
    travelStyle: string;
    interests: string[];
  };
  onStage?: (stage: string) => void;
}

export function useTripGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, profile, onStage }: GenerateParams): Promise<Itinerary | null> => {
      const endpoint = `/api/v1/trips/${tripId}/generate`;

      const res = await apiFetchRaw(endpoint, {
        source: "useTripGeneration",
        method: "POST",
        body: {
          ...(profile ? { profile } : {}),
        },
        fallbackMessage: "Generation failed",
      });

      if (!res.body) {
        throw new Error("Generation failed: no response stream");
      }

      const initialRequestId = res.headers.get("x-request-id");
      let resultTripId: string | null = null;

      try {
        await consumeSSEStream(res.body, (event) => {
          const stage = event.stage as string | undefined;
          if (stage) onStage?.(stage);
          if (stage === "done" && event.trip_id) {
            resultTripId = event.trip_id as string;
          }
          if (stage === "error") {
            throw new Error((event.message as string) || "Generation failed");
          }
        });

        if (!resultTripId) {
          throw new Error("Generation failed: stream ended before completion");
        }

        const trip = await fetchTrip(resultTripId);
        queryClient.setQueryData(queryKeys.trips.detail(resultTripId), trip);

        const raw = trip?.itineraries?.[0]?.data;
        return raw ? parseItineraryData(raw) : null;
      } catch (error) {
        await reportApiError({
          source: "useTripGeneration",
          endpoint,
          method: "POST",
          message: error instanceof Error ? error.message : "Generation failed",
          requestId: initialRequestId,
        });
        throw error instanceof Error ? error : new Error("Generation failed");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.trips.all,
      });
    },
  });
}
