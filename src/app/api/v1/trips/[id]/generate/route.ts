// ============================================================
// Travel Pro — POST /api/v1/trips/[id]/generate
// Kick off route skeleton building for a trip and stream progress via SSE
// ============================================================
import { apiHandler, assertTripAccess, parseAndValidateRequest } from "@/lib/api/helpers";
import { GenerateTripInputSchema } from "@/lib/features/generation/schemas";
import { createTripGenerationStreamResponse } from "@/lib/features/generation/trip-generation-service";
import { resolveTripUserProfile } from "@/lib/features/profile/profile-service";
import { loadTripContext } from "@/lib/features/trips/trip-query-service";
import { createLogger } from "@/lib/core/logger";

const log = createLogger("api:generate");

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = apiHandler("POST /api/v1/trips/:id/generate", async (req, params) => {
  const t0 = Date.now();
  log.info("Generate request received", {
    tripId: params.id,
    hasUserAgent: !!req.headers.get("user-agent"),
  });

  const tripAccess = await assertTripAccess(req, params.id, { requireTripOwner: true });
  if (!tripAccess) {
    throw new Error("Trip access unexpectedly missing for generation request");
  }
  log.info("Trip access verified", { tripId: params.id, elapsed: `${Date.now() - t0}ms` });

  const { profile: requestProfile } = await parseAndValidateRequest(req, GenerateTripInputSchema);
  const profile = await resolveTripUserProfile(tripAccess.profileId, requestProfile);
  log.info("Request body validated", {
    tripId: params.id,
    travelStyle: profile.travelStyle,
    hasNationality: !!profile.nationality,
    hasHomeAirport: !!profile.homeAirport,
    interestCount: profile.interests?.length ?? 0,
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

  // Build a single-city input from the trip intent for now.
  // In a follow-up task the client will send an explicit cities array.
  const cities = intent.destination
    ? [
        {
          city: intent.destination,
          country: intent.destinationCountry ?? "",
          countryCode: intent.destinationCountryCode ?? "",
          lat: intent.destinationLat ?? 0,
          lng: intent.destinationLng ?? 0,
        },
      ]
    : [];

  log.info("Starting SSE generation stream", {
    tripId: params.id,
    cities: cities.map((c) => c.city),
    elapsed: `${Date.now() - t0}ms`,
  });

  return createTripGenerationStreamResponse({
    tripId: params.id,
    trip,
    intent,
    profile,
    cities,
    signal: req.signal,
  });
});
