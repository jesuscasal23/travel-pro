import type { TripDay, CityStop } from "@/types";

/**
 * Recalculates `isTravel` / `travelFrom` / `travelTo` fields on days
 * after the route has been edited (reordered, added, removed cities).
 *
 * Strategy:
 * - Reassign each day to a city based on the new route order and day counts.
 * - For each city boundary (last day of city N → first day of city N+1),
 *   mark that last day as a travel day.
 * - travelDuration is cleared because it's no longer accurate after a reorder.
 */
export function recalculateTravelDays(
  days: TripDay[],
  newRoute: CityStop[],
): TripDay[] {
  if (newRoute.length === 0 || days.length === 0) return days;

  // Build a mapping: day number → city (based on new route + day counts)
  // We assign days sequentially to cities based on their `days` property.
  const dayToCity: Record<number, string> = {};
  let cursor = 0;
  for (const city of newRoute) {
    for (let i = 0; i < city.days; i++) {
      if (cursor < days.length) {
        dayToCity[days[cursor].day] = city.city;
        cursor++;
      }
    }
  }
  // Any leftover days (if total days > route total) stay with the last city
  const lastCity = newRoute[newRoute.length - 1]?.city;
  while (cursor < days.length) {
    dayToCity[days[cursor].day] = lastCity ?? days[cursor].city;
    cursor++;
  }

  // Determine which day numbers mark the last day of each city group
  // (i.e., the day right before the city changes)
  const travelDayNums = new Set<number>();
  const travelConnections = new Map<number, { from: string; to: string }>();

  for (let i = 0; i < days.length - 1; i++) {
    const thisCity = dayToCity[days[i].day];
    const nextCity = dayToCity[days[i + 1].day];
    if (thisCity && nextCity && thisCity !== nextCity) {
      travelDayNums.add(days[i].day);
      travelConnections.set(days[i].day, { from: thisCity, to: nextCity });
    }
  }

  return days.map((day) => {
    const newCity = dayToCity[day.day] ?? day.city;
    if (travelDayNums.has(day.day)) {
      const conn = travelConnections.get(day.day)!;
      return {
        ...day,
        city: newCity,
        isTravel: true,
        travelFrom: conn.from,
        travelTo: conn.to,
        travelDuration: undefined,
      };
    }
    // Clear stale travel flags on non-travel days
    return {
      ...day,
      city: newCity,
      isTravel: false,
      travelFrom: undefined,
      travelTo: undefined,
      travelDuration: undefined,
    };
  });
}
