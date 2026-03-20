import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { parseItineraryData } from "@/lib/utils/trip-metadata";
import { apiFetch, apiFetchRaw } from "@/lib/client/api-fetch";
import { reportApiError } from "@/lib/client/api-error-reporting";
import type { Itinerary } from "@/types";

interface GenerateParams {
  tripId: string;
  profile: {
    nationality: string;
    homeAirport: string;
    travelStyle: string;
    interests: string[];
  };
  promptVersion: "v1";
  cities?: Array<{
    id: string;
    city: string;
    country: string;
    countryCode: string;
    iataCode: string;
    lat: number;
    lng: number;
    minDays: number;
    maxDays: number;
  }>;
  onStage?: (stage: string) => void;
}

export function useTripGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      profile,
      promptVersion,
      cities,
      onStage,
    }: GenerateParams): Promise<Itinerary | null> => {
      const endpoint = `/api/v1/trips/${tripId}/generate`;

      const res = await apiFetchRaw(endpoint, {
        source: "useTripGeneration",
        method: "POST",
        body: {
          profile,
          promptVersion,
          ...(cities ? { cities } : {}),
        },
        fallbackMessage: "Generation failed",
      });

      if (!res.body) {
        throw new Error("Generation failed: no response stream");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const initialRequestId = res.headers.get("x-request-id");
      let resultTripId: string | null = null;
      let buffer = "";

      const processFrame = (frame: string) => {
        let payload = "";
        for (const line of frame.split("\n")) {
          const normalized = line.trim();
          if (!normalized.startsWith("data:")) continue;
          payload += normalized.slice(5).trim();
        }
        if (!payload) return;

        try {
          const event = JSON.parse(payload) as {
            stage?: string;
            trip_id?: string;
            message?: string;
          };
          if (event.stage) onStage?.(event.stage);
          if (event.stage === "done" && event.trip_id) {
            resultTripId = event.trip_id;
          }
          if (event.stage === "error") {
            throw new Error(event.message || "Generation failed");
          }
        } catch (e) {
          if (e instanceof SyntaxError) {
            return;
          }
          throw e instanceof Error ? e : new Error("Generation failed");
        }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (value) {
            buffer += decoder.decode(value, { stream: !done });
          }
          const normalized = buffer.replace(/\r\n/g, "\n");
          const frames = normalized.split("\n\n");
          buffer = frames.pop() ?? "";
          for (const frame of frames) processFrame(frame);
          if (done) break;
        }

        if (buffer.trim()) processFrame(buffer);

        if (!resultTripId) {
          throw new Error("Generation failed: stream ended before completion");
        }

        // Fetch the completed trip data
        const tripData = await apiFetch<{
          trip?: { itineraries?: Array<{ data: unknown }> };
        }>(`/api/v1/trips/${resultTripId}`, {
          source: "useTripGeneration",
          fallbackMessage: "Generated trip could not be loaded",
        });

        const raw = tripData.trip?.itineraries?.[0]?.data;
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
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.trips.detail(variables.tripId),
      });
    },
  });
}
