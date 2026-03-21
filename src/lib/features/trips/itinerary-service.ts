// ============================================================
// Travel Pro — Itinerary Service
// Centralizes itinerary lifecycle: versioning, activation,
// generation state transitions. No HTTP concerns.
// ============================================================
import { prisma } from "@/lib/core/prisma";
import crypto from "crypto";
import { GENERATING_ITINERARY_SELECT, ITINERARY_VERSION_SELECT } from "./query-shapes";
import { createLogger } from "@/lib/core/logger";
import { STALE_GENERATION_MAX_AGE_MS } from "@/lib/config/constants";
import type { Itinerary } from "@/types";

const log = createLogger("itinerary-service");

export class GenerationAlreadyInProgressError extends Error {
  constructor(
    public tripId: string,
    public itineraryId: string,
    public generationJobId?: string | null
  ) {
    super("Generation already in progress");
    this.name = "GenerationAlreadyInProgressError";
  }
}

/**
 * Find the current active itinerary for a trip.
 * Returns null if no active itinerary exists.
 */
export async function findActiveItinerary(tripId: string) {
  return prisma.itinerary.findFirst({
    where: { tripId, isActive: true },
    orderBy: { version: "desc" },
  });
}

/**
 * Create a new itinerary version from edited data.
 * Deactivates the previous version and creates a new one at version+1.
 * Uses a transaction to ensure atomicity.
 */
export async function createItineraryVersion(input: {
  tripId: string;
  data: Itinerary;
  promptVersion: string;
  previousItineraryId: string;
  previousVersion: number;
}) {
  const { tripId, data, promptVersion, previousItineraryId, previousVersion } = input;

  log.info("Creating itinerary version", {
    tripId,
    previousVersion,
    newVersion: previousVersion + 1,
  });

  const [, newItinerary] = await prisma.$transaction([
    // Deactivate previous version
    prisma.itinerary.update({
      where: { id: previousItineraryId },
      data: { isActive: false },
    }),
    // Create new version
    prisma.itinerary.create({
      data: {
        tripId,
        data: data as object,
        version: previousVersion + 1,
        isActive: true,
        promptVersion,
        generationStatus: "complete",
      },
    }),
  ]);

  return newItinerary;
}

/**
 * Create an itinerary record in "generating" state (isActive: false).
 * Called at the start of AI generation before the pipeline runs.
 */
export async function createGeneratingRecord(input: { tripId: string; promptVersion: string }) {
  const t0 = Date.now();
  const generationJobId = crypto.randomUUID();

  log.info("createGeneratingRecord: starting", {
    tripId: input.tripId,
    promptVersion: input.promptVersion,
    generationJobId,
  });

  const record = await prisma.$transaction(async (tx) => {
    log.info("createGeneratingRecord: acquiring advisory lock", { tripId: input.tripId });
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.tripId}))`;
    log.info("createGeneratingRecord: advisory lock acquired", {
      tripId: input.tripId,
      elapsed: `${Date.now() - t0}ms`,
    });

    const existing = await tx.itinerary.findFirst({
      where: { tripId: input.tripId, generationStatus: "generating" },
      orderBy: { createdAt: "desc" },
      select: GENERATING_ITINERARY_SELECT,
    });

    if (existing) {
      const ageMs = Date.now() - existing.createdAt.getTime();
      log.info("createGeneratingRecord: found existing generating record", {
        tripId: input.tripId,
        existingId: existing.id,
        existingJobId: existing.generationJobId,
        ageMs,
        staleThresholdMs: STALE_GENERATION_MAX_AGE_MS,
        isStale: ageMs > STALE_GENERATION_MAX_AGE_MS,
      });

      if (ageMs <= STALE_GENERATION_MAX_AGE_MS) {
        throw new GenerationAlreadyInProgressError(
          input.tripId,
          existing.id,
          existing.generationJobId
        );
      }

      log.warn("createGeneratingRecord: marking stale record as failed", {
        tripId: input.tripId,
        staleItineraryId: existing.id,
        ageMs,
      });
      await tx.itinerary.update({
        where: { id: existing.id },
        data: { generationStatus: "failed" },
      });
    }

    const latest = await tx.itinerary.findFirst({
      where: { tripId: input.tripId },
      orderBy: { version: "desc" },
      select: ITINERARY_VERSION_SELECT,
    });

    const newVersion = (latest?.version ?? 0) + 1;
    log.info("createGeneratingRecord: creating new record", {
      tripId: input.tripId,
      newVersion,
      previousVersion: latest?.version ?? null,
      generationJobId,
    });

    return tx.itinerary.create({
      data: {
        tripId: input.tripId,
        data: {},
        version: newVersion,
        isActive: false,
        promptVersion: input.promptVersion,
        generationStatus: "generating",
        generationJobId,
      },
    });
  });

  log.info("createGeneratingRecord: complete", {
    itineraryId: record.id,
    tripId: input.tripId,
    version: record.version,
    generationJobId: record.generationJobId,
    duration: `${Date.now() - t0}ms`,
  });
  return { id: record.id };
}

/**
 * Mark a generating itinerary as complete, store data, activate it,
 * and deactivate all other itineraries for the same trip.
 * Uses a transaction to ensure atomicity.
 */
export async function activateGeneratedItinerary(
  itineraryId: string,
  tripId: string,
  data: Itinerary
) {
  const t0 = Date.now();
  log.info("activateGeneratedItinerary: starting transaction", {
    itineraryId,
    tripId,
    hasRoute: !!data.route,
    routeLength: data.route?.length,
    daysLength: data.days?.length,
    hasVisaData: !!data.visaData,
    hasFlightOptions: !!data.flightOptions,
  });

  await prisma.$transaction([
    // Activate this itinerary with the generated data
    prisma.itinerary.update({
      where: { id: itineraryId },
      data: {
        data: data as object,
        isActive: true,
        generationStatus: "complete",
      },
    }),
    // Deactivate all other itineraries for this trip
    prisma.itinerary.updateMany({
      where: { tripId, id: { not: itineraryId } },
      data: { isActive: false },
    }),
  ]);

  log.info("activateGeneratedItinerary: transaction complete", {
    itineraryId,
    tripId,
    duration: `${Date.now() - t0}ms`,
  });
}

/**
 * Mark a generating itinerary as failed.
 */
export async function markGenerationFailed(itineraryId: string) {
  const t0 = Date.now();
  log.warn("markGenerationFailed: updating record", { itineraryId });

  await prisma.itinerary.update({
    where: { id: itineraryId },
    data: { generationStatus: "failed" },
  });

  log.info("markGenerationFailed: complete", {
    itineraryId,
    duration: `${Date.now() - t0}ms`,
  });
}
