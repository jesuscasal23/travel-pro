// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    trip: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { prisma } from "@/lib/db/prisma";
import { TripNotFoundError } from "@/lib/api/errors";
import { getOrCreateTripShareToken } from "../trip-share-service";

const mockPrisma = prisma as unknown as {
  trip: {
    findUnique: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getOrCreateTripShareToken", () => {
  it("returns the existing token without updating", async () => {
    mockPrisma.trip.findUnique.mockResolvedValue({ shareToken: "existing-token" });

    await expect(getOrCreateTripShareToken("trip-1")).resolves.toBe("existing-token");

    expect(mockPrisma.trip.updateMany).not.toHaveBeenCalled();
  });

  it("creates a token when the trip does not have one yet", async () => {
    mockPrisma.trip.findUnique.mockResolvedValue({ shareToken: null });
    mockPrisma.trip.updateMany.mockResolvedValue({ count: 1 });

    const token = await getOrCreateTripShareToken("trip-1");

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
    expect(mockPrisma.trip.updateMany).toHaveBeenCalledWith({
      where: {
        id: "trip-1",
        shareToken: null,
      },
      data: {
        shareToken: token,
      },
    });
  });

  it("returns the winning token when another request creates it first", async () => {
    mockPrisma.trip.findUnique
      .mockResolvedValueOnce({ shareToken: null })
      .mockResolvedValueOnce({ shareToken: "winning-token" });
    mockPrisma.trip.updateMany.mockResolvedValue({ count: 0 });

    await expect(getOrCreateTripShareToken("trip-1")).resolves.toBe("winning-token");

    expect(mockPrisma.trip.findUnique).toHaveBeenCalledTimes(2);
    expect(mockPrisma.trip.updateMany).toHaveBeenCalledTimes(1);
  });

  it("throws a not-found error when the trip does not exist", async () => {
    mockPrisma.trip.findUnique.mockResolvedValue(null);

    await expect(getOrCreateTripShareToken("missing-trip")).rejects.toBeInstanceOf(
      TripNotFoundError
    );
  });
});
