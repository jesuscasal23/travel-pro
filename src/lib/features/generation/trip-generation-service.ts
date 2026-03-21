import { parseIataCode } from "@/lib/affiliate/link-generator";
import { generateRouteOnly } from "@/lib/ai/pipeline";
import { ApiError, ServiceMisconfiguredError } from "@/lib/api/errors";
import { abortableDelay, isAbortError, throwIfAborted } from "@/lib/core/abort";
import { buildFlightLegsFromRoute } from "@/lib/flights/route-utils";
import { prefetchFlightOptions as serpApiPrefetch } from "@/lib/flights/serpapi";
import { getOptionalSerpApiEnv } from "@/lib/config/server-env";
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
  const t0 = Date.now();
  const elapsed = () => `${Date.now() - t0}ms`;

  log.info("createTripGenerationStreamResponse called", {
    tripId: input.tripId,
    tripType: input.intent.tripType,
    region: input.intent.region,
    destination: input.intent.destination,
    dateStart: input.intent.dateStart,
    dateEnd: input.intent.dateEnd,
    travelers: input.trip.travelers,
    travelStyle: input.profile.travelStyle,
    nationality: input.profile.nationality,
    homeAirport: input.profile.homeAirport,
    promptVersion: input.promptVersion,
    preSelectedCities: input.cities?.map((c) => c.city) ?? null,
  });

  let itineraryId: string;
  try {
    ({ id: itineraryId } = await createGeneratingRecord({
      tripId: input.tripId,
      promptVersion: input.promptVersion,
    }));
    log.info("Generating record created", {
      tripId: input.tripId,
      itineraryId,
      elapsed: elapsed(),
    });
  } catch (error) {
    if (error instanceof GenerationAlreadyInProgressError) {
      log.warn("Generation already in progress — rejecting with 409", {
        tripId: input.tripId,
        existingItineraryId: error.itineraryId,
        existingJobId: error.generationJobId,
        elapsed: elapsed(),
      });
      throw new ApiError(409, "Generation already in progress", {
        itineraryId: error.itineraryId,
        generationJobId: error.generationJobId ?? undefined,
      });
    }
    log.error("Failed to create generating record", {
      tripId: input.tripId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      elapsed: elapsed(),
    });
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
        log.info("[SSE] Stage: route — starting AI generation", {
          tripId: input.tripId,
          itineraryId,
          elapsed: elapsed(),
        });
        send({ stage: "route", message: "Planning your route...", pct: 20 });

        const tGen = Date.now();
        const itinerary: Itinerary = await generateRouteOnly(
          input.profile,
          input.intent,
          input.cities,
          { signal: input.signal }
        );
        log.info("[SSE] AI generation complete", {
          tripId: input.tripId,
          itineraryId,
          routeCities: itinerary.route.map((r) => r.city),
          routeLength: itinerary.route.length,
          totalDays: itinerary.days.length,
          hasVisaData: !!itinerary.visaData,
          generationDuration: `${Date.now() - tGen}ms`,
          elapsed: elapsed(),
        });
        throwIfAborted(input.signal);

        try {
          const homeIata = parseIataCode(input.profile.homeAirport);
          const legs = buildFlightLegsFromRoute(
            itinerary.route,
            input.trip.dateStart,
            input.trip.dateEnd,
            homeIata
          );

          log.info("[SSE] Flight legs built", {
            tripId: input.tripId,
            homeIata,
            legCount: legs.length,
            legs: legs.map((l) => `${l.fromIata}→${l.toIata} (${l.departureDate})`),
            elapsed: elapsed(),
          });

          if (legs.length > 0) {
            send({ stage: "flights", message: "Searching flights...", pct: 70 });

            const serpApi = getOptionalSerpApiEnv();
            log.info("[SSE] Stage: flights — starting prefetch", {
              tripId: input.tripId,
              serpApiAvailable: !!serpApi,
              legCount: legs.length,
              travelers: input.trip.travelers,
              timeoutMs: FLIGHT_PREFETCH_TIMEOUT_MS,
              elapsed: elapsed(),
            });

            const tFlights = Date.now();
            const flightOptions = serpApi
              ? await Promise.race([
                  serpApiPrefetch(serpApi.apiKey, legs, input.trip.travelers, input.signal),
                  abortableDelay(FLIGHT_PREFETCH_TIMEOUT_MS, input.signal).then(() => null),
                ])
              : null;

            const hasResults = flightOptions?.some((leg) => leg.results.length > 0) ?? false;
            log.info("[SSE] Flight prefetch complete", {
              tripId: input.tripId,
              flightOptionsNull: flightOptions === null,
              hasResults,
              legResults:
                flightOptions?.map((l) => ({
                  leg: `${l.fromIata}→${l.toIata}`,
                  resultCount: l.results.length,
                })) ?? null,
              flightDuration: `${Date.now() - tFlights}ms`,
              elapsed: elapsed(),
            });

            if (hasResults && flightOptions) {
              itinerary.flightOptions = flightOptions;
            }
          } else {
            log.info("[SSE] Skipping flight prefetch — no legs", {
              tripId: input.tripId,
              elapsed: elapsed(),
            });
          }
        } catch (error) {
          if (isAbortError(error)) {
            throw error;
          }
          log.warn("[SSE] Flight pre-fetch failed (non-blocking)", {
            tripId: input.tripId,
            itineraryId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            elapsed: elapsed(),
          });
        }

        throwIfAborted(input.signal);
        log.info("[SSE] Activating itinerary in DB", {
          tripId: input.tripId,
          itineraryId,
          elapsed: elapsed(),
        });
        const tActivate = Date.now();
        await activateGeneratedItinerary(itineraryId, input.tripId, itinerary);
        log.info("[SSE] Itinerary activated", {
          tripId: input.tripId,
          itineraryId,
          activateDuration: `${Date.now() - tActivate}ms`,
          elapsed: elapsed(),
        });

        if (!input.signal.aborted) {
          send({
            stage: "done",
            message: "Your trip is ready!",
            pct: 100,
            itinerary_id: itineraryId,
            trip_id: input.tripId,
          });
          log.info("[SSE] Generation complete — done event sent", {
            tripId: input.tripId,
            itineraryId,
            totalDuration: elapsed(),
          });
        }
      } catch (error) {
        const aborted = isAbortError(error) || input.signal.aborted;

        if (aborted) {
          log.info("[SSE] Generation aborted by client", {
            tripId: input.tripId,
            itineraryId,
            signalAborted: input.signal.aborted,
            isAbortErrorType: isAbortError(error),
            elapsed: elapsed(),
          });
        } else {
          log.error("[SSE] Generation failed", {
            tripId: input.tripId,
            itineraryId,
            errorName: error instanceof Error ? error.name : "unknown",
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            errorType: error?.constructor?.name,
            elapsed: elapsed(),
          });
        }

        try {
          await markGenerationFailed(itineraryId);
          log.info("[SSE] Marked itinerary as failed", { itineraryId, elapsed: elapsed() });
        } catch (markError) {
          log.error("[SSE] Failed to mark itinerary as failed", {
            itineraryId,
            error: markError instanceof Error ? markError.message : String(markError),
            elapsed: elapsed(),
          });
        }

        if (!aborted && !input.signal.aborted) {
          const userMessage = getGenerationFailureMessage(error);
          log.info("[SSE] Sending error event to client", {
            tripId: input.tripId,
            userMessage,
            elapsed: elapsed(),
          });
          send({ stage: "error", message: userMessage, pct: 0 });
        }
      } finally {
        controller.close();
        log.info("[SSE] Stream closed", {
          tripId: input.tripId,
          itineraryId,
          totalDuration: elapsed(),
        });
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
