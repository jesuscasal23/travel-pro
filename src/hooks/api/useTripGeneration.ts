import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { parseItineraryData } from "@/lib/utils/trip-metadata";
import type { Itinerary } from "@/types";

interface GenerateParams {
  tripId: string;
  profile: {
    nationality: string;
    homeAirport: string;
    travelStyle: string;
    interests: string[];
  };
  promptVersion: string;
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
      const res = await fetch(`/api/v1/trips/${tripId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          promptVersion,
          ...(cities ? { cities } : {}),
        }),
      });

      if (!res.ok || !res.body) throw new Error("Generation failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let resultTripId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        for (const line of text.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            onStage?.(event.stage);
            if (event.stage === "done" && event.trip_id) {
              resultTripId = event.trip_id;
            }
            if (event.stage === "error") {
              throw new Error("Generation failed");
            }
          } catch (e) {
            if (e instanceof Error && e.message === "Generation failed") throw e;
            /* ignore malformed SSE lines */
          }
        }
      }

      if (!resultTripId) return null;

      // Fetch the completed trip data
      const tripData = await fetch(`/api/v1/trips/${resultTripId}`).then((r) =>
        r.json(),
      );
      const raw = tripData.trip?.itineraries?.[0]?.data;
      return raw ? parseItineraryData(raw) : null;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.detail(variables.tripId),
      });
    },
  });
}
