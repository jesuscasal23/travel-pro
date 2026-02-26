// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    itinerary: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { prisma } from "@/lib/db/prisma";
import {
  findActiveItinerary,
  createItineraryVersion,
  createGeneratingRecord,
  activateGeneratedItinerary,
  markGenerationFailed,
  cleanupStaleGenerations,
} from "../itinerary-service";

const mockPrisma = prisma as unknown as {
  itinerary: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── findActiveItinerary ─────────────────────────────────────

describe("findActiveItinerary", () => {
  it("returns the active itinerary when one exists", async () => {
    const mockItinerary = { id: "itin-1", tripId: "trip-1", isActive: true, version: 2 };
    mockPrisma.itinerary.findFirst.mockResolvedValue(mockItinerary);

    const result = await findActiveItinerary("trip-1");

    expect(result).toEqual(mockItinerary);
    expect(mockPrisma.itinerary.findFirst).toHaveBeenCalledWith({
      where: { tripId: "trip-1", isActive: true },
      orderBy: { version: "desc" },
    });
  });

  it("returns null when no active itinerary exists", async () => {
    mockPrisma.itinerary.findFirst.mockResolvedValue(null);

    const result = await findActiveItinerary("trip-1");

    expect(result).toBeNull();
  });
});

// ── createItineraryVersion ──────────────────────────────────

describe("createItineraryVersion", () => {
  it("uses a transaction and returns the new itinerary", async () => {
    const newItinerary = { id: "itin-2", tripId: "trip-1", version: 3, isActive: true };
    mockPrisma.$transaction.mockResolvedValue([{}, newItinerary]);

    const result = await createItineraryVersion({
      tripId: "trip-1",
      data: { route: [], days: [] } as never,
      promptVersion: "v1",
      previousItineraryId: "itin-1",
      previousVersion: 2,
    });

    expect(result).toEqual(newItinerary);
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("deactivates previous and creates new version with correct args", async () => {
    mockPrisma.$transaction.mockResolvedValue([{}, { id: "new", version: 4 }]);

    await createItineraryVersion({
      tripId: "trip-1",
      data: { route: [], days: [] } as never,
      promptVersion: "v1",
      previousItineraryId: "itin-old",
      previousVersion: 3,
    });

    // Verify both Prisma operations were constructed with correct args
    expect(mockPrisma.itinerary.update).toHaveBeenCalledWith({
      where: { id: "itin-old" },
      data: { isActive: false },
    });
    expect(mockPrisma.itinerary.create).toHaveBeenCalledWith({
      data: {
        tripId: "trip-1",
        data: expect.anything(),
        version: 4,
        isActive: true,
        promptVersion: "v1",
        generationStatus: "complete",
      },
    });
  });
});

// ── createGeneratingRecord ──────────────────────────────────

describe("createGeneratingRecord", () => {
  it("creates a record in generating state with isActive false", async () => {
    mockPrisma.itinerary.create.mockResolvedValue({ id: "gen-1" });

    const result = await createGeneratingRecord({
      tripId: "trip-1",
      promptVersion: "v1",
    });

    expect(result).toEqual({ id: "gen-1" });
    expect(mockPrisma.itinerary.create).toHaveBeenCalledWith({
      data: {
        tripId: "trip-1",
        data: {},
        version: 1,
        isActive: false,
        promptVersion: "v1",
        generationStatus: "generating",
      },
    });
  });
});

// ── activateGeneratedItinerary ──────────────────────────────

describe("activateGeneratedItinerary", () => {
  it("activates the itinerary and deactivates others in a transaction", async () => {
    mockPrisma.$transaction.mockResolvedValue([{}, {}]);

    await activateGeneratedItinerary("itin-1", "trip-1", { route: [], days: [] } as never);

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    // Verify the activate update was constructed
    expect(mockPrisma.itinerary.update).toHaveBeenCalledWith({
      where: { id: "itin-1" },
      data: {
        data: expect.anything(),
        isActive: true,
        generationStatus: "complete",
      },
    });
    // Verify the deactivate-others updateMany was constructed
    expect(mockPrisma.itinerary.updateMany).toHaveBeenCalledWith({
      where: { tripId: "trip-1", id: { not: "itin-1" } },
      data: { isActive: false },
    });
  });

  it("does not throw on success", async () => {
    mockPrisma.$transaction.mockResolvedValue([{}, {}]);

    await expect(
      activateGeneratedItinerary("itin-1", "trip-1", { route: [], days: [] } as never)
    ).resolves.toBeUndefined();
  });
});

// ── markGenerationFailed ────────────────────────────────────

describe("markGenerationFailed", () => {
  it("updates the generation status to failed", async () => {
    mockPrisma.itinerary.update.mockResolvedValue({});

    await markGenerationFailed("itin-1");

    expect(mockPrisma.itinerary.update).toHaveBeenCalledWith({
      where: { id: "itin-1" },
      data: { generationStatus: "failed" },
    });
  });
});

// ── cleanupStaleGenerations ─────────────────────────────────

describe("cleanupStaleGenerations", () => {
  it("marks stale generating records as failed", async () => {
    mockPrisma.itinerary.updateMany.mockResolvedValue({ count: 3 });

    const result = await cleanupStaleGenerations();

    expect(result).toBe(3);
    expect(mockPrisma.itinerary.updateMany).toHaveBeenCalledWith({
      where: {
        generationStatus: "generating",
        createdAt: { lt: expect.any(Date) },
      },
      data: { generationStatus: "failed" },
    });
  });

  it("returns 0 when no stale records exist", async () => {
    mockPrisma.itinerary.updateMany.mockResolvedValue({ count: 0 });

    const result = await cleanupStaleGenerations();

    expect(result).toBe(0);
  });

  it("uses the provided maxAgeMs for the cutoff", async () => {
    mockPrisma.itinerary.updateMany.mockResolvedValue({ count: 1 });

    const before = Date.now();
    await cleanupStaleGenerations(5 * 60 * 1000); // 5 minutes
    const after = Date.now();

    const callArgs = mockPrisma.itinerary.updateMany.mock.calls[0][0];
    const cutoff = callArgs.where.createdAt.lt as Date;

    // Cutoff should be ~5 minutes before now (within a small tolerance)
    expect(cutoff.getTime()).toBeGreaterThanOrEqual(before - 5 * 60 * 1000 - 100);
    expect(cutoff.getTime()).toBeLessThanOrEqual(after - 5 * 60 * 1000 + 100);
  });

  it("defaults to 2 minute maxAge", async () => {
    mockPrisma.itinerary.updateMany.mockResolvedValue({ count: 0 });

    const before = Date.now();
    await cleanupStaleGenerations();
    const after = Date.now();

    const callArgs = mockPrisma.itinerary.updateMany.mock.calls[0][0];
    const cutoff = callArgs.where.createdAt.lt as Date;

    expect(cutoff.getTime()).toBeGreaterThanOrEqual(before - 2 * 60 * 1000 - 100);
    expect(cutoff.getTime()).toBeLessThanOrEqual(after - 2 * 60 * 1000 + 100);
  });
});
