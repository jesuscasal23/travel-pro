// ============================================================
// Fichi — Itinerary Service
// Centralizes itinerary lifecycle: versioning, activation,
// generation state transitions. No HTTP concerns.
// ============================================================
import { prisma } from "@/lib/core/prisma";
import { createLogger } from "@/lib/core/logger";
import type { Itinerary } from "@/types";

const log = createLogger("itinerary-service");

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
        discoveryStatus: "completed",
      },
    }),
  ]);

  return newItinerary;
}
