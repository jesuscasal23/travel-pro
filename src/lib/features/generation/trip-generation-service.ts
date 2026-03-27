import { ApiError, ServiceMisconfiguredError } from "@/lib/api/errors";
import { isAbortError, throwIfAborted } from "@/lib/core/abort";
import { createLogger } from "@/lib/core/logger";
import { prefetchFlightsForRoute } from "@/lib/flights";
import { lookupIata } from "@/lib/flights/city-iata-map";
import {
  activateGeneratedItinerary,
  createGeneratingRecord,
  GenerationAlreadyInProgressError,
  markGenerationFailed,
} from "@/lib/features/trips/itinerary-service";
import { addDays, daysBetween, formatDateShort } from "@/lib/utils/format/date";
import type { CityStop, Itinerary, TripDay, TripIntent, UserProfile } from "@/types";

const log = createLogger("trip-generation-service");

// ── City input type ────────────────────────────────────────────────────────────

export interface CityInput {
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  iataCode?: string;
}

// ── Route builder ──────────────────────────────────────────────────────────────

/**
 * Build a route skeleton programmatically from a user-provided city list.
 * No AI call needed — days are distributed evenly across cities.
 */
export function buildRouteFromCities(
  cities: CityInput[],
  dateStart: string,
  dateEnd: string
): Itinerary {
  const totalDays = dateStart && dateEnd ? Math.max(1, daysBetween(dateStart, dateEnd)) : 7;
  const perCity = Math.floor(totalDays / cities.length);

  const route: CityStop[] = cities.map((c, i) => ({
    id: c.city.toLowerCase().replace(/\s+/g, "-"),
    city: c.city,
    country: c.country,
    countryCode: c.countryCode,
    lat: c.lat,
    lng: c.lng,
    iataCode: c.iataCode ?? lookupIata(c.city),
    // Last city absorbs any remainder
    days: i === cities.length - 1 ? totalDays - perCity * (cities.length - 1) : perCity,
  }));

  const days: TripDay[] = [];
  let dayIndex = 0;
  for (const stop of route) {
    for (let d = 0; d < stop.days; d++) {
      days.push({
        day: dayIndex + 1,
        date: dateStart ? formatDateShort(addDays(dateStart, dayIndex)) : `Day ${dayIndex + 1}`,
        city: stop.city,
        isTravel: false as const,
        activities: [],
      });
      dayIndex++;
    }
  }

  return { route, days };
}

// ── Service interface ──────────────────────────────────────────────────────────

interface CreateTripGenerationStreamResponseInput {
  tripId: string;
  trip: {
    dateStart: string;
    dateEnd: string;
    travelers: number;
  };
  intent: TripIntent;
  profile: UserProfile;
  cities: CityInput[];
  signal: AbortSignal;
}

function getGenerationFailureMessage(error: unknown): string {
  if (error instanceof ServiceMisconfiguredError) {
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
    cities: input.cities.map((c) => c.city),
  });

  let itineraryId: string;
  try {
    ({ id: itineraryId } = await createGeneratingRecord({
      tripId: input.tripId,
      promptVersion: "skeleton-v1",
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
        log.info("[SSE] Stage: route — building skeleton from city list", {
          tripId: input.tripId,
          itineraryId,
          cityCount: input.cities.length,
          elapsed: elapsed(),
        });
        send({ stage: "route", message: "Planning your route...", pct: 20 });

        const tGen = Date.now();
        const itinerary: Itinerary = buildRouteFromCities(
          input.cities,
          input.trip.dateStart,
          input.trip.dateEnd
        );
        log.info("[SSE] Route skeleton built", {
          tripId: input.tripId,
          itineraryId,
          routeCities: itinerary.route.map((r) => r.city),
          routeLength: itinerary.route.length,
          totalDays: itinerary.days.length,
          buildDuration: `${Date.now() - tGen}ms`,
          elapsed: elapsed(),
        });
        throwIfAborted(input.signal);

        try {
          send({ stage: "flights", message: "Searching flights...", pct: 70 });

          const tFlights = Date.now();
          const flightOptions = await prefetchFlightsForRoute({
            homeAirport: input.profile.homeAirport,
            route: itinerary.route,
            dateStart: input.trip.dateStart,
            dateEnd: input.trip.dateEnd,
            travelers: input.trip.travelers,
            signal: input.signal,
          });

          log.info("[SSE] Flight prefetch complete", {
            tripId: input.tripId,
            hasResults: !!flightOptions,
            flightDuration: `${Date.now() - tFlights}ms`,
            elapsed: elapsed(),
          });

          if (flightOptions) {
            itinerary.flightOptions = flightOptions;
          }
        } catch (error) {
          if (isAbortError(error)) {
            throw error;
          }
          log.warn("[SSE] Flight pre-fetch failed (non-blocking)", {
            tripId: input.tripId,
            itineraryId,
            error: error instanceof Error ? error.message : String(error),
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
