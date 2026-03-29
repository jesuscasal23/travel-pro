// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/core/prisma", () => ({
  prisma: {
    trip: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/core/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { prisma } from "@/lib/core/prisma";
import { deleteTripById } from "../trip-collection-service";

const mockPrisma = prisma as unknown as {
  trip: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

const tx = {
  $executeRaw: vi.fn(),
  itinerary: {
    deleteMany: vi.fn(),
  },
  flightSelection: {
    deleteMany: vi.fn(),
  },
  hotelSelection: {
    deleteMany: vi.fn(),
  },
  discoveredActivity: {
    deleteMany: vi.fn(),
  },
  affiliateClick: {
    deleteMany: vi.fn(),
  },
  discoveredCity: {
    updateMany: vi.fn(),
  },
  trip: {
    delete: vi.fn(),
  },
};

beforeEach(() => {
  vi.clearAllMocks();

  mockPrisma.trip.findUnique.mockResolvedValue({
    id: "trip-1",
  });
  tx.$executeRaw.mockResolvedValue(undefined);
  tx.flightSelection.deleteMany.mockResolvedValue({ count: 0 });
  tx.hotelSelection.deleteMany.mockResolvedValue({ count: 0 });
  tx.discoveredActivity.deleteMany.mockResolvedValue({ count: 0 });
  tx.affiliateClick.deleteMany.mockResolvedValue({ count: 3 });
  tx.discoveredCity.updateMany.mockResolvedValue({ count: 1 });
  tx.itinerary.deleteMany.mockResolvedValue({ count: 2 });
  tx.trip.delete.mockResolvedValue({ id: "trip-1" });
  mockPrisma.$transaction.mockImplementation(async (callback) => callback(tx));
});

describe("deleteTripById", () => {
  it("deletes related database rows before removing the trip", async () => {
    const result = await deleteTripById("trip-1");

    expect(result).toEqual({ success: true });
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.flightSelection.deleteMany).toHaveBeenCalledWith({
      where: { tripId: "trip-1" },
    });
    expect(tx.hotelSelection.deleteMany).toHaveBeenCalledWith({
      where: { tripId: "trip-1" },
    });
    expect(tx.discoveredActivity.deleteMany).toHaveBeenCalledWith({
      where: { tripId: "trip-1" },
    });
    expect(tx.affiliateClick.deleteMany).toHaveBeenCalledWith({
      where: { tripId: "trip-1" },
    });
    expect(tx.discoveredCity.updateMany).toHaveBeenCalledWith({
      where: { firstTripId: "trip-1" },
      data: { firstTripId: null },
    });
    expect(tx.itinerary.deleteMany).toHaveBeenCalledWith({
      where: { tripId: "trip-1" },
    });
    expect(tx.trip.delete).toHaveBeenCalledWith({
      where: { id: "trip-1" },
    });
  });
});
