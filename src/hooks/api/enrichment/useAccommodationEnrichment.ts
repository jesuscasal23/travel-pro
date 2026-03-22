import type { CityStop, TravelStyle } from "@/types";
import {
  useEnrichmentQuery,
  fetchAccommodationEnrichment,
  getAccommodationQueryKey,
} from "./shared";

export function useAccommodationEnrichment(
  route: CityStop[],
  dateStart: string,
  travelers: number,
  travelStyle: TravelStyle,
  enabled: boolean
) {
  return useEnrichmentQuery({
    queryKey: getAccommodationQueryKey(route, dateStart, travelers, travelStyle),
    queryFn: (signal) =>
      fetchAccommodationEnrichment(route, dateStart, travelers, travelStyle, signal),
    enabled: enabled && route.length > 0 && !!dateStart && travelers > 0,
    staleTime: 30 * 60 * 1000,
  });
}
