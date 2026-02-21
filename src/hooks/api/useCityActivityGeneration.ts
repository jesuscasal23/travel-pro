import { useMutation } from "@tanstack/react-query";
import { useTripStore } from "@/stores/useTripStore";
import type { TripDay } from "@/types";

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
  const mergeCityActivities = useTripStore((s) => s.mergeCityActivities);

  return useMutation({
    mutationFn: async ({
      tripId,
      cityId,
      profile,
    }: GenerateCityActivitiesParams): Promise<TripDay[]> => {
      const res = await fetch(`/api/v1/trips/${tripId}/generate-activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, cityId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Activity generation failed");
      }

      const data = await res.json();
      return data.days as TripDay[];
    },
    onSuccess: (updatedDays, variables) => {
      mergeCityActivities(variables.cityName, updatedDays);
    },
  });
}
