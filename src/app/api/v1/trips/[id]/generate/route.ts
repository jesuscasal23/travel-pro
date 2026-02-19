// ============================================================
// Travel Pro — POST /api/v1/trips/[id]/generate
// Kick off AI generation for a trip and stream progress via SSE
// ============================================================
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { generateItinerary } from "@/lib/ai/pipeline";
import { apiHandler, ApiError, parseJsonBody, validateBody } from "@/lib/api/helpers";
import { ProfileInputSchema } from "@/lib/api/schemas";
import type { UserProfile, TripIntent } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GenerateSchema = z.object({
  profile: ProfileInputSchema,
  promptVersion: z.string().default("v1"),
});

export const POST = apiHandler("POST /api/v1/trips/:id/generate", async (req, params) => {
  const body = await parseJsonBody(req);
  const { profile, promptVersion } = validateBody(GenerateSchema, body);

  // Load the trip
  const trip = await prisma.trip.findUnique({ where: { id: params.id } });
  if (!trip) throw new ApiError(404, "Trip not found");

  const isSingleCity = trip.tripType === "single-city";

  const intent: TripIntent = {
    id: trip.id,
    tripType: (trip.tripType as TripIntent["tripType"]) ?? "multi-city",
    region: trip.region,
    destination: trip.destination ?? undefined,
    destinationCountry: trip.destinationCountry ?? undefined,
    destinationCountryCode: trip.destinationCountryCode ?? undefined,
    dateStart: trip.dateStart,
    dateEnd: trip.dateEnd,
    flexibleDates: trip.flexibleDates,
    budget: trip.budget,
    travelers: trip.travelers,
  };

  // Create itinerary record in "generating" state
  const itineraryRecord = await prisma.itinerary.create({
    data: {
      tripId: params.id,
      data: {},
      version: 1,
      isActive: false,
      promptVersion,
      generationStatus: "generating",
    },
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

        // Run generation
        const itinerary = await generateItinerary(profile as UserProfile, intent);

        send({ stage: "visa", message: "Checking visa requirements...", pct: 55 });
        await sleep(300);

        send({ stage: "weather", message: "Analysing weather patterns...", pct: 70 });
        await sleep(300);

        send({ stage: "budget", message: "Calculating your budget...", pct: 85 });
        await sleep(200);

        // Save to DB
        await prisma.itinerary.update({
          where: { id: itineraryRecord.id },
          data: {
            data: itinerary as object,
            isActive: true,
            generationStatus: "complete",
          },
        });

        // Deactivate any previous versions
        await prisma.itinerary.updateMany({
          where: { tripId: params.id, id: { not: itineraryRecord.id } },
          data: { isActive: false },
        });

        send({
          stage: "done",
          message: "Your trip is ready!",
          pct: 100,
          itinerary_id: itineraryRecord.id,
          trip_id: params.id,
        });
      } catch (err) {
        console.error("[generate SSE] Error:", err);

        await prisma.itinerary.update({
          where: { id: itineraryRecord.id },
          data: { generationStatus: "failed" },
        });

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
