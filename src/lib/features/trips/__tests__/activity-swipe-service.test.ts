import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/core/prisma", () => ({
  prisma: {
    discoveredActivity: { update: vi.fn() },
    itinerary: { updateMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/core/prisma";
import { recordActivitySwipe } from "../activity-swipe-service";

const mockPrisma = prisma as unknown as {
  discoveredActivity: { update: ReturnType<typeof vi.fn> };
  itinerary: { updateMany: ReturnType<typeof vi.fn> };
};

describe("recordActivitySwipe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.discoveredActivity.update.mockResolvedValue({ id: "activity-1", decision: "liked" });
    mockPrisma.itinerary.updateMany.mockResolvedValue({ count: 1 });
  });

  it("updates the discovered activity decision and decidedAt", async () => {
    await recordActivitySwipe({
      tripId: "trip-1",
      activityId: "activity-1",
      decision: "liked",
    });

    expect(mockPrisma.discoveredActivity.update).toHaveBeenCalledWith({
      where: { id: "activity-1" },
      data: {
        decision: "liked",
        decidedAt: expect.any(Date),
      },
    });
    expect(mockPrisma.itinerary.updateMany).not.toHaveBeenCalled();
  });

  it("marks discovery complete on final swipe", async () => {
    await recordActivitySwipe({
      tripId: "trip-1",
      activityId: "activity-2",
      decision: "disliked",
      isFinal: true,
    });

    expect(mockPrisma.discoveredActivity.update).toHaveBeenCalledWith({
      where: { id: "activity-2" },
      data: {
        decision: "disliked",
        decidedAt: expect.any(Date),
      },
    });
    expect(mockPrisma.itinerary.updateMany).toHaveBeenCalledWith({
      where: { tripId: "trip-1", isActive: true },
      data: { discoveryStatus: "completed" },
    });
  });
});
