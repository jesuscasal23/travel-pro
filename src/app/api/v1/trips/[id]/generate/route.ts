// ============================================================
// Travel Pro — POST /api/v1/trips/[id]/generate
// Kick off AI generation for a trip and stream progress via SSE
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { generateItinerary } from "@/lib/ai/pipeline";
import type { UserProfile, TripIntent } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GenerateSchema = z.object({
  profile: z.object({
    nationality: z.string().min(1).max(100),
    homeAirport: z.string().min(2).max(100),
    travelStyle: z.enum(["backpacker", "comfort", "luxury"]),
    interests: z.array(z.string().max(50)).max(10),
  }),
  promptVersion: z.string().default("v1"),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  // Load the trip
  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const { profile, promptVersion } = parsed.data;

  const intent: TripIntent = {
    id: trip.id,
    region: trip.region,
    dateStart: trip.dateStart,
    dateEnd: trip.dateEnd,
    flexibleDates: trip.flexibleDates,
    budget: trip.budget,
    vibe: trip.vibe as TripIntent["vibe"],
    travelers: trip.travelers,
  };

  // Create itinerary record in "generating" state
  const itineraryRecord = await prisma.itinerary.create({
    data: {
      tripId: id,
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
        send({ stage: "route", message: "Optimising your route...", pct: 15 });
        await sleep(500);

        send({ stage: "activities", message: "Planning daily activities...", pct: 35 });

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
          where: { tripId: id, id: { not: itineraryRecord.id } },
          data: { isActive: false },
        });

        send({
          stage: "done",
          message: "Your trip is ready!",
          pct: 100,
          itinerary_id: itineraryRecord.id,
          trip_id: id,
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
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
