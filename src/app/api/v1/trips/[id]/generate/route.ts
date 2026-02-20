// ============================================================
// Travel Pro — POST /api/v1/trips/[id]/generate
// Kick off AI generation for a trip and stream progress via SSE
// ============================================================
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { generateCoreItinerary } from "@/lib/ai/pipeline";
import { apiHandler, ApiError, parseJsonBody, validateBody } from "@/lib/api/helpers";
import { ProfileInputSchema, CityWithDaysInputSchema } from "@/lib/api/schemas";
import { tripToIntent } from "@/lib/services/trip-service";
import {
  createGeneratingRecord,
  activateGeneratedItinerary,
  markGenerationFailed,
} from "@/lib/services/itinerary-service";
import type { UserProfile } from "@/types";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/v1/trips/generate");

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GenerateSchema = z.object({
  profile: ProfileInputSchema,
  promptVersion: z.string().default("v1"),
  cities: z.array(CityWithDaysInputSchema).optional(),
});

export const POST = apiHandler("POST /api/v1/trips/:id/generate", async (req, params) => {
  const body = await parseJsonBody(req);
  const { profile, promptVersion, cities } = validateBody(GenerateSchema, body);

  // Load the trip
  const trip = await prisma.trip.findUnique({ where: { id: params.id } });
  if (!trip) throw new ApiError(404, "Trip not found");

  const isSingleCity = trip.tripType === "single-city";
  const intent = tripToIntent(trip);

  // Create itinerary record in "generating" state
  const { id: itineraryId } = await createGeneratingRecord({
    tripId: params.id,
    promptVersion,
  });

  // Return SSE stream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        if (isSingleCity) {
          send({ stage: "activities", message: "Exploring neighborhoods...", pct: 20 });
        } else {
          send({ stage: "route", message: "Optimising your route...", pct: 15 });
          await sleep(500);
          send({ stage: "activities", message: "Planning daily activities...", pct: 35 });
        }

        // Run core generation (no enrichment — visa/weather fetched by client in background)
        const itinerary = await generateCoreItinerary(profile as UserProfile, intent, cities);

        // Save + activate in one atomic transaction
        await activateGeneratedItinerary(itineraryId, params.id, itinerary);

        send({
          stage: "done",
          message: "Your trip is ready!",
          pct: 100,
          itinerary_id: itineraryId,
          trip_id: params.id,
        });
      } catch (err) {
        log.error("SSE generation error", { error: err instanceof Error ? err.message : String(err) });

        await markGenerationFailed(itineraryId);

        send({ stage: "error", message: "Generation failed. Please try again.", pct: 0 });
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
