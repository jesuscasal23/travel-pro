import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client/api-fetch";
import type { Itinerary } from "@/types";

interface GenerateCityActivitiesParams {
  tripId: string;
  cityId: string;
  cityName: string;
  profile: {
    nationality: string;
    homeAirport: string;
    travelStyle: string;
    interests: string[];
  };
}

export function useCityActivityGeneration() {
  return useMutation({
    mutationFn: async ({
      tripId,
      cityId,
      profile,
    }: GenerateCityActivitiesParams): Promise<Itinerary> => {
      const data = await apiFetch<{ itinerary: Itinerary }>(
        `/api/v1/trips/${tripId}/generate-activities`,
        {
          source: "useCityActivityGeneration",
          method: "POST",
          body: { profile, cityId },
          fallbackMessage: "Activity generation failed",
        }
      );
      return data.itinerary;
    },
  });
}
