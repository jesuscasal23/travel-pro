// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
vi.mock("@/lib/core/prisma", () => ({
  prisma: {
    itinerary: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
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
import { findActiveItinerary, createItineraryVersion } from "../itinerary-service";

const mockPrisma = prisma as unknown as {
  itinerary: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
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
        buildStatus: "complete",
        discoveryStatus: "completed",
      },
    });
  });
});
