// ============================================================
// Travel Pro — POST /api/v1/trips/[id]/generate
// Kick off AI generation for a trip and stream progress via SSE
// ============================================================
import { prisma } from "@/lib/db/prisma";
import { generateRouteOnly } from "@/lib/ai/pipeline";
import {
  apiHandler,
  ApiError,
  assertTripAccess,
  parseJsonBody,
  validateBody,
} from "@/lib/api/helpers";
import { GenerateTripInputSchema } from "@/lib/api/schemas";
import { tripToIntent } from "@/lib/services/trip-service";
import {
  createGeneratingRecord,
  activateGeneratedItinerary,
  GenerationAlreadyInProgressError,
  markGenerationFailed,
} from "@/lib/services/itinerary-service";
import type { Itinerary, CityStop } from "@/types";
import { createLogger } from "@/lib/logger";
import { prefetchFlightOptions } from "@/lib/flights/amadeus";
import { parseIataCode } from "@/lib/affiliate/link-generator";
import { lookupIata } from "@/lib/flights/city-iata-map";
import { abortableDelay, isAbortError, throwIfAborted } from "@/lib/abort";

const log = createLogger("api/v1/trips/generate");

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = apiHandler("POST /api/v1/trips/:id/generate", async (req, params) => {
  const signal = req.signal;
  await assertTripAccess(req, params.id, { requireOwnershipForUserTrips: true });

  const body = await parseJsonBody(req);
  const { profile, promptVersion, cities } = validateBody(GenerateTripInputSchema, body);

  // Load the trip
  const trip = await prisma.trip.findUnique({ where: { id: params.id } });
  if (!trip) throw new ApiError(404, "Trip not found");

  const intent = tripToIntent(trip);

  // Create itinerary record in "generating" state
  let itineraryId: string;
  try {
    ({ id: itineraryId } = await createGeneratingRecord({
      tripId: params.id,
      promptVersion,
    }));
  } catch (error) {
    if (error instanceof GenerationAlreadyInProgressError) {
      throw new ApiError(409, "Generation already in progress", {
        itineraryId: error.itineraryId,
        generationJobId: error.generationJobId ?? undefined,
      });
    }
    throw error;
  }

  // Return SSE stream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        throwIfAborted(signal);
        send({ stage: "route", message: "Planning your route...", pct: 20 });

        // Run route-only generation (no activities, no enrichment)
        const itinerary: Itinerary = await generateRouteOnly(profile, intent, cities, { signal });
        throwIfAborted(signal);

        // Best-effort flight pre-fetch (8s timeout, never blocks itinerary delivery)
        try {
          const homeIata = parseIataCode(profile.homeAirport);
          const legs = buildLegsFromRoute(itinerary.route, trip.dateStart, trip.dateEnd, homeIata);

          if (legs.length > 0) {
            send({ stage: "flights", message: "Searching flights...", pct: 70 });

            const flightOptions = await Promise.race([
              prefetchFlightOptions(legs, trip.travelers, signal),
              abortableDelay(8000, signal).then(() => null),
            ]);

            if (flightOptions && flightOptions.some((l) => l.results.length > 0)) {
              itinerary.flightOptions = flightOptions;
            }
          }
        } catch (e) {
          if (isAbortError(e)) {
            throw e;
          }
          log.warn("Flight pre-fetch failed (non-blocking)", {
            error: e instanceof Error ? e.message : String(e),
          });
        }

        // Save + activate in one atomic transaction
        throwIfAborted(signal);
        await activateGeneratedItinerary(itineraryId, params.id, itinerary);

        if (!signal.aborted) {
          send({
            stage: "done",
            message: "Your trip is ready!",
            pct: 100,
            itinerary_id: itineraryId,
            trip_id: params.id,
          });
        }
      } catch (err) {
        const aborted = isAbortError(err) || signal.aborted;

        if (aborted) {
          log.info("SSE generation aborted by client", { tripId: params.id, itineraryId });
        } else {
          log.error("SSE generation error", {
            error: err instanceof Error ? err.message : String(err),
          });
        }

        await markGenerationFailed(itineraryId);

        if (!aborted && !signal.aborted) {
          send({ stage: "error", message: "Generation failed. Please try again.", pct: 0 });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

/** Build flight legs from route + trip dates for pre-fetching. */
function buildLegsFromRoute(
  route: CityStop[],
  dateStart: string,
  dateEnd: string,
  homeIata: string
): Array<{ fromIata: string; toIata: string; departureDate: string }> {
  const legs: Array<{ fromIata: string; toIata: string; departureDate: string }> = [];

  const resolveIata = (stop: CityStop): string | undefined =>
    stop.iataCode ?? lookupIata(stop.city);

  if (route.length === 0) return legs;

  // Home → first city
  const firstIata = resolveIata(route[0]);
  if (homeIata && firstIata) {
    legs.push({ fromIata: homeIata, toIata: firstIata, departureDate: dateStart });
  }

  // Inter-city legs: accumulate days to compute departure dates
  let dayOffset = 0;
  for (let i = 0; i < route.length - 1; i++) {
    dayOffset += route[i].days;
    const fromIata = resolveIata(route[i]);
    const toIata = resolveIata(route[i + 1]);
    if (fromIata && toIata) {
      const d = new Date(dateStart);
      d.setDate(d.getDate() + dayOffset);
      legs.push({
        fromIata,
        toIata,
        departureDate: d.toISOString().slice(0, 10),
      });
    }
  }

  // Last city → home
  const lastIata = resolveIata(route[route.length - 1]);
  if (homeIata && lastIata) {
    legs.push({ fromIata: lastIata, toIata: homeIata, departureDate: dateEnd });
  }

  return legs;
}
