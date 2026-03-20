import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
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
          body: { profile, cityId },
          fallbackMessage: "Activity generation failed",
        }
      );
      return data.itinerary;
    },
    onSuccess: (itinerary, variables) => {
      queryClient.setQueryData(
        queryKeys.trips.detail(variables.tripId),
        (
          previous:
            | {
                itineraries?: Array<Record<string, unknown>>;
              }
            | null
            | undefined
        ) => {
          if (!previous?.itineraries?.length) return previous;
          const [first, ...rest] = previous.itineraries;
          return {
            ...previous,
            itineraries: [{ ...first, data: itinerary }, ...rest],
          };
        }
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
    },
  });
}
