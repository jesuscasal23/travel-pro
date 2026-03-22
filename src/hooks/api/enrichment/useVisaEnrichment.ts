import { queryKeys } from "@/hooks/api/keys";
import type { CityStop } from "@/types";
import { useEnrichmentQuery, routeKey, fetchVisaEnrichment } from "./shared";

export function useVisaEnrichment(nationality: string, route: CityStop[], enabled: boolean) {
  return useEnrichmentQuery({
    queryKey: queryKeys.enrichment.visa(nationality, routeKey(route)),
    queryFn: () => fetchVisaEnrichment(nationality, route),
    enabled: enabled && !!nationality && route.length > 0,
  });
}
