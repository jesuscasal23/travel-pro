import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";
import type { CityStop, VisaInfo } from "@/types";
import { buildRoutePayload, routeKey } from "./shared";

async function fetchVisa(nationality: string, route: CityStop[]): Promise<VisaInfo[]> {
  const data = await apiFetch<{ visaData?: VisaInfo[] }>("/api/v1/enrich/visa", {
    source: "useVisaEnrichment",
    method: "POST",
    body: { nationality, route: buildRoutePayload(route) },
    fallbackMessage: "Failed to load visa data",
  });
  return data.visaData ?? [];
}

export function useVisaEnrichment(nationality: string, route: CityStop[], enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.enrichment.visa(nationality, routeKey(route)),
    queryFn: () => fetchVisa(nationality, route),
    enabled: enabled && !!nationality && route.length > 0,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
