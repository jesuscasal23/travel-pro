import { createEnrichmentRoute } from "@/lib/api/enrichment-route";
import { EnrichVisaInputSchema } from "@/lib/features/enrichment/schemas";
import { getVisaEnrichment } from "@/lib/features/enrichment/service";

export const POST = createEnrichmentRoute(
  "POST /api/v1/enrich/visa",
  EnrichVisaInputSchema,
  getVisaEnrichment,
  "visaData"
);
