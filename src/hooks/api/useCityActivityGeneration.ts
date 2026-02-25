import { useMutation } from "@tanstack/react-query";
import { parseApiErrorResponse, reportApiError } from "@/lib/client/api-error-reporting";
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
      const endpoint = `/api/v1/trips/${tripId}/generate-activities`;
      let res: Response;
      try {
        res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, cityId }),
        });
      } catch (error) {
        await reportApiError({
          source: "useCityActivityGeneration",
          endpoint,
          method: "POST",
          message:
            error instanceof Error
              ? error.message
              : "Network error while generating city activities",
        });
        throw new Error("Activity generation failed");
      }

      if (!res.ok) {
        const parsed = await parseApiErrorResponse(res, "Activity generation failed");
        await reportApiError({
          source: "useCityActivityGeneration",
          endpoint,
          method: "POST",
          message: parsed.message,
          status: parsed.status,
          requestId: parsed.requestId,
          responseBody: parsed.responseBody,
        });
        throw new Error(parsed.message);
      }

      const data = await res.json();
      return data.itinerary as Itinerary;
    },
  });
}
