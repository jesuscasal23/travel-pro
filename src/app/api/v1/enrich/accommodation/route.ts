import { createEnrichmentRoute } from "@/lib/api/enrichment-route";
import { EnrichAccommodationInputSchema } from "@/lib/features/enrichment/schemas";
import { enrichAccommodation } from "@/lib/ai/enrich-accommodation";

export const POST = createEnrichmentRoute(
  "POST /api/v1/enrich/accommodation",
  EnrichAccommodationInputSchema,
  (input) => enrichAccommodation(input.route, input.dateStart, input.travelers, input.travelStyle),
  "accommodationData"
);
