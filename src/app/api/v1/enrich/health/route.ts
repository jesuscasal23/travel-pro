import { createEnrichmentRoute } from "@/lib/api/enrichment-route";
import { EnrichHealthInputSchema } from "@/lib/features/enrichment/schemas";
import { enrichHealth } from "@/lib/ai/enrich-health";
import { buildSyntheticCityStops } from "@/lib/features/enrichment/transforms";

export const POST = createEnrichmentRoute(
  "POST /api/v1/enrich/health",
  EnrichHealthInputSchema,
  (input) => enrichHealth(buildSyntheticCityStops(input.route)),
  "healthData"
);
