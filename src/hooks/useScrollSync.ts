"use client";

import { useCallback, useRef } from "react";
import type { CityStop, TripDay } from "@/types";

/**
 * Manages scroll sync between the map and the day-by-day timeline.
 * - Map pin click → scroll timeline to first day for that city
 * - Day card click → highlight map pin (via setActiveCityIndex)
 */
export function useScrollSync(
  route: CityStop[],
  itinerary: TripDay[],
  setActiveCityIndex: (index: number | null) => void
) {
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);

  /** Called when a map pin is clicked */
  const handleCityClick = useCallback(
    (index: number | null) => {
      setActiveCityIndex(index);
      if (index === null) return;
      const city = route[index]?.city;
      const dayIndex = itinerary.findIndex((d) => d.city === city);
      if (dayIndex >= 0) {
        dayRefs.current[dayIndex]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    },
    [route, itinerary, setActiveCityIndex]
  );

  /** Called when a day card is clicked — returns the city index for the map */
  const getCityIndexForDay = useCallback(
    (cityName: string) => {
      return route.findIndex((c) => c.city === cityName);
    },
    [route]
  );

  return { dayRefs, handleCityClick, getCityIndexForDay };
}
