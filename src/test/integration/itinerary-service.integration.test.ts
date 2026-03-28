// ============================================================
// Itinerary Service — Integration Tests (real $transaction)
// ============================================================
import { describe, it, expect, vi } from "vitest";
import { prisma } from "@/lib/core/prisma";
import { createTestTrip, createTestItinerary } from "./helpers";

// Mock only the logger (no side effects)
vi.mock("@/lib/core/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import {
  findActiveItinerary,
  createItineraryVersion,
} from "@/lib/features/trips/itinerary-service";

describe("itinerary-service", () => {
  it("findActiveItinerary returns the active itinerary", async () => {
    const trip = await createTestTrip(prisma);
    const active = await createTestItinerary(prisma, trip.id, {
      isActive: true,
    });
    await createTestItinerary(prisma, trip.id, {
      isActive: false,
      version: 2,
    });

    const result = await findActiveItinerary(trip.id);
    expect(result?.id).toBe(active.id);
    expect(result?.isActive).toBe(true);
  });

  it("findActiveItinerary returns null when none active", async () => {
    const trip = await createTestTrip(prisma);
    await createTestItinerary(prisma, trip.id, { isActive: false });

    const result = await findActiveItinerary(trip.id);
    expect(result).toBeNull();
  });

  it("createItineraryVersion atomically deactivates old and creates new", async () => {
    const trip = await createTestTrip(prisma);
    const v1 = await createTestItinerary(prisma, trip.id, {
      version: 1,
      isActive: true,
    });

    const v2 = await createItineraryVersion({
      tripId: trip.id,
      data: { route: [], days: [] } as never,
      promptVersion: "v1",
      previousItineraryId: v1.id,
      previousVersion: 1,
    });

    expect(v2.version).toBe(2);
    expect(v2.isActive).toBe(true);
    expect(v2.generationStatus).toBe("complete");

    // Old version deactivated
    const oldVersion = await prisma.itinerary.findUnique({
      where: { id: v1.id },
    });
    expect(oldVersion?.isActive).toBe(false);
  });
});
