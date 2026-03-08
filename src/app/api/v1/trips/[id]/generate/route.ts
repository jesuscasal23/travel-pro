// ============================================================
// Travel Pro — POST /api/v1/trips/[id]/generate
// Kick off AI generation for a trip and stream progress via SSE
// ============================================================
import { apiHandler, assertTripAccess, parseAndValidateRequest } from "@/lib/api/helpers";
import { GenerateTripInputSchema } from "@/lib/features/generation/schemas";
import { createTripGenerationStreamResponse } from "@/lib/features/generation/trip-generation-service";
import { loadTripContext } from "@/lib/features/trips/trip-query-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = apiHandler("POST /api/v1/trips/:id/generate", async (req, params) => {
  await assertTripAccess(req, params.id, { requireTripOwner: true });

  const { profile, promptVersion, cities } = await parseAndValidateRequest(
    req,
    GenerateTripInputSchema
  );
  const { trip, intent } = await loadTripContext(params.id);

  return createTripGenerationStreamResponse({
    tripId: params.id,
    trip,
    intent,
    profile,
    promptVersion,
    cities,
    signal: req.signal,
  });
});
