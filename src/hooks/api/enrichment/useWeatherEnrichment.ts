import { queryKeys } from "@/hooks/api/keys";
import type { CityStop } from "@/types";
import { useEnrichmentQuery, routeKey, fetchWeatherEnrichment } from "./shared";

export function useWeatherEnrichment(route: CityStop[], dateStart: string, enabled: boolean) {
  return useEnrichmentQuery({
    queryKey: queryKeys.enrichment.weather(routeKey(route), dateStart),
    queryFn: () => fetchWeatherEnrichment(route, dateStart),
    enabled: enabled && route.length > 0 && !!dateStart,
  });
}
