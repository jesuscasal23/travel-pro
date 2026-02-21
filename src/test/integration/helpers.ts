// ============================================================
// Integration Test Helpers — Factory Functions
// ============================================================
import type { PrismaClient } from "@prisma/client";

/** Create a minimal valid Trip row. */
export async function createTestTrip(
  prisma: PrismaClient,
  overrides: Record<string, unknown> = {},
) {
  return prisma.trip.create({
    data: {
      tripType: "multi-city",
      region: "southeast-asia",
      dateStart: "2026-04-01",
      dateEnd: "2026-04-22",
      budget: 10000,
      travelers: 2,
      ...overrides,
    },
  });
}

/** Create a minimal valid Profile row. */
export async function createTestProfile(
  prisma: PrismaClient,
  userId: string,
  overrides: Record<string, unknown> = {},
) {
  return prisma.profile.create({
    data: {
      userId,
      nationality: "German",
      homeAirport: "FRA",
      travelStyle: "comfort",
      interests: ["culture", "food"],
      ...overrides,
    },
  });
}

/** Create a minimal valid Itinerary row for a trip. */
export async function createTestItinerary(
  prisma: PrismaClient,
  tripId: string,
  overrides: Record<string, unknown> = {},
) {
  return prisma.itinerary.create({
    data: {
      tripId,
      data: { route: [], days: [], budget: {} },
      version: 1,
      isActive: true,
      promptVersion: "v1",
      generationStatus: "complete",
      ...overrides,
    },
  });
}
