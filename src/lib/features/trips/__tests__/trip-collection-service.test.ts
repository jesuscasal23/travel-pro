// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRedisScan = vi.fn();
const mockRedisDel = vi.fn();
const mockRedis = {
  scan: mockRedisScan,
  del: mockRedisDel,
};

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(
    class MockRedis {
      constructor() {
        return mockRedis;
      }
    }
  ),
}));

vi.mock("@/lib/config/server-env", () => ({
  getOptionalRedisEnv: vi.fn(),
}));

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

import { Redis } from "@upstash/redis";
import { getOptionalRedisEnv } from "@/lib/config/server-env";
import { prisma } from "@/lib/core/prisma";
import { deleteTripById } from "../trip-collection-service";

const mockGetOptionalRedisEnv = getOptionalRedisEnv as ReturnType<typeof vi.fn>;
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
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  itineraryEdit: {
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

  mockGetOptionalRedisEnv.mockReturnValue(null);
  mockPrisma.trip.findUnique.mockResolvedValue({
    id: "trip-1",
  });
  tx.$executeRaw.mockResolvedValue(undefined);
  tx.itinerary.findMany.mockResolvedValue([{ id: "itin-1" }, { id: "itin-2" }]);
  tx.itineraryEdit.deleteMany.mockResolvedValue({ count: 2 });
  tx.affiliateClick.deleteMany.mockResolvedValue({ count: 3 });
  tx.discoveredCity.updateMany.mockResolvedValue({ count: 1 });
  tx.itinerary.deleteMany.mockResolvedValue({ count: 2 });
  tx.trip.delete.mockResolvedValue({ id: "trip-1" });
  mockPrisma.$transaction.mockImplementation(async (callback) => callback(tx));
  mockRedisScan.mockResolvedValue(["0", []]);
  mockRedisDel.mockResolvedValue(0);
});

describe("deleteTripById", () => {
  it("deletes related database rows before removing the trip", async () => {
    const result = await deleteTripById("trip-1");

    expect(result).toEqual({ success: true });
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.itinerary.findMany).toHaveBeenCalledWith({
      where: { tripId: "trip-1" },
      select: { id: true },
    });
    expect(tx.itineraryEdit.deleteMany).toHaveBeenCalledWith({
      where: { itineraryId: { in: ["itin-1", "itin-2"] } },
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

  it("scans and deletes trip-scoped Redis keys when Redis is configured", async () => {
    mockGetOptionalRedisEnv.mockReturnValue({
      url: "https://redis.test",
      token: "token-1",
    });
    mockRedisScan
      .mockResolvedValueOnce(["0", ["trip:trip-1", "trip:trip-1:summary"]])
      .mockResolvedValue(["0", []]);

    await deleteTripById("trip-1");

    expect(Redis).toHaveBeenCalledWith({
      url: "https://redis.test",
      token: "token-1",
    });
    expect(mockRedisScan).toHaveBeenCalledWith("0", {
      match: "trip:trip-1",
      count: 100,
    });
    expect(mockRedisDel).toHaveBeenCalledWith("trip:trip-1", "trip:trip-1:summary");
  });
});
