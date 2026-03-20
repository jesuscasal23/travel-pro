import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";
import type { CityStop, CityWeather } from "@/types";
import { buildRoutePayload, routeKey } from "./shared";

async function fetchWeather(route: CityStop[], dateStart: string): Promise<CityWeather[]> {
  const data = await apiFetch<{ weatherData?: CityWeather[] }>("/api/v1/enrich/weather", {
    source: "useWeatherEnrichment",
    method: "POST",
    body: { route: buildRoutePayload(route), dateStart },
    fallbackMessage: "Failed to load weather data",
  });
  return data.weatherData ?? [];
}

export function useWeatherEnrichment(route: CityStop[], dateStart: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.enrichment.weather(routeKey(route), dateStart),
    queryFn: () => fetchWeather(route, dateStart),
    enabled: enabled && route.length > 0 && !!dateStart,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
