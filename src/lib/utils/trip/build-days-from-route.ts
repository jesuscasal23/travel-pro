import type { CityStop, TripDay } from "@/types";
import { recalculateTravelDays } from "./recalculate-travel-days";

/**
 * Build a TripDay[] skeleton from a route and start date.
 * Each day gets a sequential number, proper date, and city assignment.
 * Travel flags are stamped via recalculateTravelDays.
 * Activities are left empty — they come from DiscoveredActivity assignment.
 */
export function buildDaysFromRoute(route: CityStop[], dateStart: string): TripDay[] {
  const startDate = new Date(dateStart);
  const totalDays = route.reduce((sum, city) => sum + city.days, 0);

  const days: TripDay[] = [];
  let cityIdx = 0;
  let daysInCity = 0;

  for (let i = 0; i < totalDays; i++) {
    // Advance to next city if we've exhausted days in current one
    while (cityIdx < route.length && daysInCity >= route[cityIdx].days) {
      daysInCity = 0;
      cityIdx++;
    }
    if (cityIdx >= route.length) break;

    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD

    days.push({
      day: i + 1,
      date: dateStr,
      city: route[cityIdx].city,
      activities: [],
    });

    daysInCity++;
  }

  return recalculateTravelDays(days, route);
}
