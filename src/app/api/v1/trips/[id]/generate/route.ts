// ============================================================
// Travel Pro — POST /api/v1/trips/[id]/generate
// Kick off AI generation for a trip and stream progress via SSE
// ============================================================
import { apiHandler, assertTripAccess, parseAndValidateRequest } from "@/lib/api/helpers";
import { GenerateTripInputSchema } from "@/lib/features/generation/schemas";
import { createTripGenerationStreamResponse } from "@/lib/features/generation/trip-generation-service";
import { loadTripContext } from "@/lib/features/trips/trip-query-service";
import { createLogger } from "@/lib/core/logger";

const log = createLogger("api:generate");

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = apiHandler("POST /api/v1/trips/:id/generate", async (req, params) => {
  const t0 = Date.now();
  log.info("Generate request received", {
    tripId: params.id,
    method: req.method,
    url: req.nextUrl?.pathname,
    userAgent: req.headers.get("user-agent")?.slice(0, 120),
  });

  await assertTripAccess(req, params.id, { requireTripOwner: true });
  log.info("Trip access verified", { tripId: params.id, elapsed: `${Date.now() - t0}ms` });

  const { profile, promptVersion, cities } = await parseAndValidateRequest(
    req,
    GenerateTripInputSchema
  );
  log.info("Request body validated", {
    tripId: params.id,
    promptVersion,
    travelStyle: profile.travelStyle,
    nationality: profile.nationality,
    homeAirport: profile.homeAirport,
    interests: profile.interests,
    preSelectedCities: cities?.length ?? 0,
    elapsed: `${Date.now() - t0}ms`,
  });

  const { trip, intent } = await loadTripContext(params.id);
  log.info("Trip context loaded", {
    tripId: params.id,
    tripType: intent.tripType,
    region: intent.region,
    destination: intent.destination,
    dateStart: intent.dateStart,
    dateEnd: intent.dateEnd,
    travelers: trip.travelers,
    elapsed: `${Date.now() - t0}ms`,
  });

  log.info("Starting SSE generation stream", {
    tripId: params.id,
    elapsed: `${Date.now() - t0}ms`,
  });

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
