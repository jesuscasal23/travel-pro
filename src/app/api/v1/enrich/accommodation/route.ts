import { createEnrichmentRoute } from "@/lib/api/enrichment-route";
import { EnrichAccommodationInputSchema } from "@/lib/features/enrichment/schemas";
import { getAccommodationEnrichment } from "@/lib/features/enrichment/service";

export const POST = createEnrichmentRoute(
  "POST /api/v1/enrich/accommodation",
  EnrichAccommodationInputSchema,
  getAccommodationEnrichment,
  "accommodationData"
);
