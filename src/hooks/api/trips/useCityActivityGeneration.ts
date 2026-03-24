import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { updateTripDetailCache } from "@/hooks/api/trips/shared";
import { apiFetch } from "@/lib/client/api-fetch";
import type { Itinerary } from "@/types";

interface GenerateCityActivitiesParams {
  tripId: string;
  cityId: string;
  cityName: string;
  profile?: {
    nationality: string;
    homeAirport: string;
    travelStyle: string;
    interests: string[];
  };
}

export function useCityActivityGeneration() {
  const queryClient = useQueryClient();

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
          body: {
            cityId,
            ...(profile ? { profile } : {}),
          },
          fallbackMessage: "Activity generation failed",
        }
      );
      return data.itinerary;
    },
    onSuccess: (itinerary, variables) => {
      updateTripDetailCache(queryClient, variables.tripId, itinerary);
      void queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
    },
  });
}
