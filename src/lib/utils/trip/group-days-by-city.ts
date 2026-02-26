import type { Itinerary, TripDay } from "@/types";

interface CityDayGroup {
  cityId: string;
  city: string;
  country: string;
  cityIndex: number;
  days: TripDay[];
}

/** Group days by city, maintaining route order and handling revisits. */
export function groupDaysByCity(days: TripDay[], route: Itinerary["route"]): CityDayGroup[] {
  const groups: CityDayGroup[] = [];

  for (const day of days) {
    const cityIndex = route.findIndex((r) => r.city === day.city);
    const last = groups[groups.length - 1];
    if (last && last.city === day.city) {
      last.days.push(day);
    } else {
      groups.push({
        cityId: route[cityIndex]?.id ?? day.city.toLowerCase(),
        city: day.city,
        country: route[cityIndex]?.country ?? "",
        cityIndex: cityIndex >= 0 ? cityIndex : groups.length,
        days: [day],
      });
    }
  }
  return groups;
}
