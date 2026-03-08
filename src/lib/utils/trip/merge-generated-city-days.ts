import type { Itinerary, TripDay } from "@/types";

export function mergeGeneratedCityDays(
  itinerary: Itinerary,
  cityName: string,
  updatedDays: TripDay[]
): Itinerary {
  return {
    ...itinerary,
    days: itinerary.days.map((day) => {
      if (day.city !== cityName) return day;
      const updated = updatedDays.find((candidate) => candidate.day === day.day);
      return updated ? { ...day, activities: updated.activities } : day;
    }),
  };
}
