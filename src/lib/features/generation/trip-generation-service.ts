import { parseIataCode } from "@/lib/affiliate/link-generator";
import { generateRouteOnly } from "@/lib/ai/pipeline";
import { ApiError, ServiceMisconfiguredError } from "@/lib/api/errors";
import { abortableDelay, isAbortError, throwIfAborted } from "@/lib/core/abort";
import { buildFlightLegsFromRoute } from "@/lib/flights/route-utils";
import { prefetchFlightOptions } from "@/lib/flights/amadeus";
import type { CityWithDays } from "@/lib/flights/types";
import { createLogger } from "@/lib/core/logger";
import {
  activateGeneratedItinerary,
  createGeneratingRecord,
  GenerationAlreadyInProgressError,
  markGenerationFailed,
} from "@/lib/features/trips/itinerary-service";
import { FLIGHT_PREFETCH_TIMEOUT_MS } from "@/lib/config/constants";
import type { Itinerary, TripIntent, UserProfile } from "@/types";

const log = createLogger("trip-generation-service");

interface CreateTripGenerationStreamResponseInput {
  tripId: string;
  trip: {
    dateStart: string;
    dateEnd: string;
    travelers: number;
  };
  intent: TripIntent;
  profile: UserProfile;
  promptVersion: string;
  cities?: CityWithDays[];
  signal: AbortSignal;
}

function getGenerationFailureMessage(error: unknown): string {
  if (error instanceof ServiceMisconfiguredError) {
    const service =
      typeof error.details === "object" &&
      error.details !== null &&
      "service" in error.details &&
      typeof error.details.service === "string"
        ? error.details.service
        : null;

    if (service === "anthropic") {
      return "AI generation is not configured. Add ANTHROPIC_API_KEY to .env.local and restart the dev server.";
    }

    return "Trip generation is not configured on this server yet.";
  }

  return "Generation failed. Please try again.";
}

export async function createTripGenerationStreamResponse(
  input: CreateTripGenerationStreamResponseInput
): Promise<Response> {
  let itineraryId: string;
  try {
    ({ id: itineraryId } = await createGeneratingRecord({
      tripId: input.tripId,
      promptVersion: input.promptVersion,
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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        throwIfAborted(input.signal);
        send({ stage: "route", message: "Planning your route...", pct: 20 });

        const itinerary: Itinerary = await generateRouteOnly(
          input.profile,
          input.intent,
          input.cities,
          { signal: input.signal }
        );
        throwIfAborted(input.signal);

        try {
          const homeIata = parseIataCode(input.profile.homeAirport);
          const legs = buildFlightLegsFromRoute(
            itinerary.route,
            input.trip.dateStart,
            input.trip.dateEnd,
            homeIata
          );

          if (legs.length > 0) {
            send({ stage: "flights", message: "Searching flights...", pct: 70 });

            const flightOptions = await Promise.race([
              prefetchFlightOptions(legs, input.trip.travelers, input.signal),
              abortableDelay(FLIGHT_PREFETCH_TIMEOUT_MS, input.signal).then(() => null),
            ]);

            if (flightOptions && flightOptions.some((leg) => leg.results.length > 0)) {
              itinerary.flightOptions = flightOptions;
            }
          }
        } catch (error) {
          if (isAbortError(error)) {
            throw error;
          }
          log.warn("Flight pre-fetch failed (non-blocking)", {
            error: error instanceof Error ? error.message : String(error),
          });
        }

        throwIfAborted(input.signal);
        await activateGeneratedItinerary(itineraryId, input.tripId, itinerary);

        if (!input.signal.aborted) {
          send({
            stage: "done",
            message: "Your trip is ready!",
            pct: 100,
            itinerary_id: itineraryId,
            trip_id: input.tripId,
          });
        }
      } catch (error) {
        const aborted = isAbortError(error) || input.signal.aborted;

        if (aborted) {
          log.info("SSE generation aborted by client", {
            tripId: input.tripId,
            itineraryId,
          });
        } else {
          log.error("SSE generation error", {
            error: error instanceof Error ? error.message : String(error),
          });
        }

        await markGenerationFailed(itineraryId);

        if (!aborted && !input.signal.aborted) {
          send({ stage: "error", message: getGenerationFailureMessage(error), pct: 0 });
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
}
