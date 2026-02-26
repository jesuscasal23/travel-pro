// ============================================================
// Itinerary Service — Integration Tests (real $transaction)
// ============================================================
import { describe, it, expect, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { createTestTrip, createTestItinerary } from "./helpers";

// Mock only the logger (no side effects)
vi.mock("@/lib/logger", () => ({
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
  createGeneratingRecord,
  activateGeneratedItinerary,
  markGenerationFailed,
  cleanupStaleGenerations,
} from "@/lib/services/itinerary-service";

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

  it("createGeneratingRecord creates a non-active generating record", async () => {
    const trip = await createTestTrip(prisma);
    const { id } = await createGeneratingRecord({
      tripId: trip.id,
      promptVersion: "v1",
    });

    const record = await prisma.itinerary.findUnique({ where: { id } });
    expect(record?.isActive).toBe(false);
    expect(record?.generationStatus).toBe("generating");
    expect(record?.version).toBe(1);
  });

  it("activateGeneratedItinerary activates one and deactivates others", async () => {
    const trip = await createTestTrip(prisma);
    const old = await createTestItinerary(prisma, trip.id, {
      isActive: true,
      version: 1,
    });
    const generating = await createTestItinerary(prisma, trip.id, {
      isActive: false,
      version: 2,
      generationStatus: "generating",
    });

    await activateGeneratedItinerary(generating.id, trip.id, { route: [], days: [] } as never);

    const activated = await prisma.itinerary.findUnique({
      where: { id: generating.id },
    });
    expect(activated?.isActive).toBe(true);
    expect(activated?.generationStatus).toBe("complete");

    const deactivated = await prisma.itinerary.findUnique({
      where: { id: old.id },
    });
    expect(deactivated?.isActive).toBe(false);
  });

  it("markGenerationFailed updates status to failed", async () => {
    const trip = await createTestTrip(prisma);
    const itin = await createTestItinerary(prisma, trip.id, {
      generationStatus: "generating",
      isActive: false,
    });

    await markGenerationFailed(itin.id);

    const updated = await prisma.itinerary.findUnique({
      where: { id: itin.id },
    });
    expect(updated?.generationStatus).toBe("failed");
  });

  it("cleanupStaleGenerations marks old generating records as failed", async () => {
    const trip = await createTestTrip(prisma);

    // Create a generating record
    const record = await createTestItinerary(prisma, trip.id, {
      generationStatus: "generating",
      isActive: false,
    });

    // Backdate it to simulate a stale record (10 minutes ago)
    await prisma.$executeRaw`
      UPDATE itineraries SET created_at = NOW() - INTERVAL '10 minutes'
      WHERE id = ${record.id}
    `;

    const count = await cleanupStaleGenerations(2 * 60 * 1000); // 2-min cutoff
    expect(count).toBe(1);

    const updated = await prisma.itinerary.findUnique({
      where: { id: record.id },
    });
    expect(updated?.generationStatus).toBe("failed");
  });
});
