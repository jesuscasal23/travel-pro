// ============================================================
// Travel Pro — Itinerary Service
// Centralizes itinerary lifecycle: versioning, activation,
// generation state transitions. No HTTP concerns.
// ============================================================
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";
import {
  GENERATING_ITINERARY_SELECT,
  ITINERARY_VERSION_SELECT,
} from "@/lib/features/trips/query-shapes";
import { createLogger } from "@/lib/logger";
import type { Itinerary } from "@/types";

const log = createLogger("itinerary-service");
const STALE_GENERATION_MAX_AGE_MS = 2 * 60 * 1000;

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
  const generationJobId = crypto.randomUUID();
  const record = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.tripId}))`;

    const existing = await tx.itinerary.findFirst({
      where: { tripId: input.tripId, generationStatus: "generating" },
      orderBy: { createdAt: "desc" },
      select: GENERATING_ITINERARY_SELECT,
    });

    if (existing) {
      if (Date.now() - existing.createdAt.getTime() <= STALE_GENERATION_MAX_AGE_MS) {
        throw new GenerationAlreadyInProgressError(
          input.tripId,
          existing.id,
          existing.generationJobId
        );
      }

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

    return tx.itinerary.create({
      data: {
        tripId: input.tripId,
        data: {},
        version: (latest?.version ?? 0) + 1,
        isActive: false,
        promptVersion: input.promptVersion,
        generationStatus: "generating",
        generationJobId,
      },
    });
  });

  log.info("Created generating record", {
    itineraryId: record.id,
    tripId: input.tripId,
    version: record.version,
    generationJobId: record.generationJobId,
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
  log.info("Activating generated itinerary", { itineraryId, tripId });

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
}

/**
 * Mark a generating itinerary as failed.
 */
export async function markGenerationFailed(itineraryId: string) {
  log.warn("Marking itinerary generation as failed", { itineraryId });

  await prisma.itinerary.update({
    where: { id: itineraryId },
    data: { generationStatus: "failed" },
  });
}

/**
 * Find and mark stale "generating" itineraries as failed.
 * A record is considered stale if it has been in "generating" state
 * longer than `maxAgeMs` (default: 2 minutes).
 *
 * This handles edge cases where the Vercel function timed out or
 * crashed before the catch/finally block could update the record.
 *
 * Returns the number of records cleaned up.
 */
export async function cleanupStaleGenerations(maxAgeMs: number = 2 * 60 * 1000): Promise<number> {
  const cutoff = new Date(Date.now() - maxAgeMs);

  const result = await prisma.itinerary.updateMany({
    where: {
      generationStatus: "generating",
      createdAt: { lt: cutoff },
    },
    data: { generationStatus: "failed" },
  });

  if (result.count > 0) {
    log.warn("Cleaned up stale generating records", {
      count: result.count,
      cutoff: cutoff.toISOString(),
    });
  } else {
    log.debug("No stale generating records found");
  }

  return result.count;
}
