import { queryKeys } from "@/hooks/api/keys";
import type { CityStop } from "@/types";
import { useEnrichmentQuery, routeKey, fetchHealthEnrichment } from "./shared";

export function useHealthEnrichment(route: CityStop[], enabled: boolean) {
  return useEnrichmentQuery({
    queryKey: queryKeys.enrichment.health(routeKey(route)),
    queryFn: () => fetchHealthEnrichment(route),
    enabled: enabled && route.length > 0,
  });
}
