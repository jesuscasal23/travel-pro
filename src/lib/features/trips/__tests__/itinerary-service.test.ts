// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
vi.mock("@/lib/core/prisma", () => ({
  prisma: {
    itinerary: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $executeRaw: vi.fn(),
    $transaction: vi.fn(),
  },
}));

// Mock logger
vi.mock("@/lib/core/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { prisma } from "@/lib/core/prisma";
import {
  findActiveItinerary,
  createItineraryVersion,
  createGeneratingRecord,
  activateGeneratedItinerary,
  GenerationAlreadyInProgressError,
  markGenerationFailed,
} from "../itinerary-service";

const mockPrisma = prisma as unknown as {
  itinerary: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  $executeRaw: ReturnType<typeof vi.fn>;
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
    const tx = {
      $executeRaw: vi.fn().mockResolvedValue(undefined),
      itinerary: {
        findFirst: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
        create: vi.fn().mockResolvedValue({
          id: "gen-1",
          version: 1,
          generationJobId: "job-1",
        }),
        update: vi.fn(),
      },
    };
    mockPrisma.$transaction.mockImplementation(async (callback) => callback(tx));

    const result = await createGeneratingRecord({
      tripId: "trip-1",
      promptVersion: "v1",
    });

    expect(result).toEqual({ id: "gen-1" });
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.itinerary.create).toHaveBeenCalledWith({
      data: {
        tripId: "trip-1",
        data: {},
        version: 1,
        isActive: false,
        promptVersion: "v1",
        generationStatus: "generating",
        generationJobId: expect.any(String),
      },
    });
  });

  it("increments the version from the latest itinerary for the trip", async () => {
    const tx = {
      $executeRaw: vi.fn().mockResolvedValue(undefined),
      itinerary: {
        findFirst: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ version: 3 }),
        create: vi.fn().mockResolvedValue({
          id: "gen-2",
          version: 4,
          generationJobId: "job-2",
        }),
        update: vi.fn(),
      },
    };
    mockPrisma.$transaction.mockImplementation(async (callback) => callback(tx));

    await createGeneratingRecord({
      tripId: "trip-1",
      promptVersion: "v2",
    });

    expect(tx.itinerary.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tripId: "trip-1",
        version: 4,
        promptVersion: "v2",
      }),
    });
  });

  it("rejects when a generation is already in progress for the trip", async () => {
    const tx = {
      $executeRaw: vi.fn().mockResolvedValue(undefined),
      itinerary: {
        findFirst: vi.fn().mockResolvedValueOnce({
          id: "gen-active",
          generationJobId: "job-active",
          createdAt: new Date(),
        }),
        create: vi.fn(),
        update: vi.fn(),
      },
    };
    mockPrisma.$transaction.mockImplementation(async (callback) => callback(tx));

    await expect(
      createGeneratingRecord({
        tripId: "trip-1",
        promptVersion: "v1",
      })
    ).rejects.toBeInstanceOf(GenerationAlreadyInProgressError);

    expect(tx.itinerary.create).not.toHaveBeenCalled();
    expect(tx.itinerary.update).not.toHaveBeenCalled();
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
