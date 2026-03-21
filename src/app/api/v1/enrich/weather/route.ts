import { createEnrichmentRoute } from "@/lib/api/enrichment-route";
import { EnrichWeatherInputSchema } from "@/lib/features/enrichment/schemas";
import { getWeatherEnrichment } from "@/lib/features/enrichment/service";

export const POST = createEnrichmentRoute(
  "POST /api/v1/enrich/weather",
  EnrichWeatherInputSchema,
  getWeatherEnrichment,
  "weatherData"
);
