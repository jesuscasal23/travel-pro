import { createEnrichmentRoute } from "@/lib/api/enrichment-route";
import { EnrichWeatherInputSchema } from "@/lib/features/enrichment/schemas";
import { enrichWeather } from "@/lib/ai/enrich-weather";
import { buildSyntheticCityStops } from "@/lib/features/enrichment/transforms";

export const POST = createEnrichmentRoute(
  "POST /api/v1/enrich/weather",
  EnrichWeatherInputSchema,
  (input) => enrichWeather(buildSyntheticCityStops(input.route), input.dateStart),
  "weatherData"
);
