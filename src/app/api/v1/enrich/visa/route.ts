import { createEnrichmentRoute } from "@/lib/api/enrichment-route";
import { EnrichVisaInputSchema } from "@/lib/features/enrichment/schemas";
import { enrichVisa } from "@/lib/ai/enrich-visa";
import { buildSyntheticCityStops } from "@/lib/features/enrichment/transforms";

export const POST = createEnrichmentRoute(
  "POST /api/v1/enrich/visa",
  EnrichVisaInputSchema,
  (input) => enrichVisa(input.nationality, buildSyntheticCityStops(input.route)),
  "visaData"
);
