import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/core/prisma", () => ({
  prisma: {
    activitySwipe: { create: vi.fn() },
    itinerary: { updateMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/core/prisma";
import { recordActivitySwipe } from "../activity-swipe-service";

const mockPrisma = prisma as unknown as {
  activitySwipe: { create: ReturnType<typeof vi.fn> };
  itinerary: { updateMany: ReturnType<typeof vi.fn> };
};

describe("recordActivitySwipe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.activitySwipe.create.mockResolvedValue({ id: "swipe-1" });
    mockPrisma.itinerary.updateMany.mockResolvedValue({ count: 1 });
  });

  it("writes a swipe row with full activity snapshot", async () => {
    await recordActivitySwipe({
      tripId: "trip-1",
      profileId: "profile-1",
      destination: "Tokyo",
      decision: "liked",
      activity: {
        name: "Senso-ji Temple",
        description: "Historic district and market walk.",
        category: "culture",
        duration: "2h",
        googleMapsUrl: "https://maps.google.com/?q=Senso-ji+Tokyo",
        imageUrl: null,
      },
    });

    expect(mockPrisma.activitySwipe.create).toHaveBeenCalledWith({
      data: {
        tripId: "trip-1",
        profileId: "profile-1",
        destination: "Tokyo",
        decision: "liked",
        activityName: "Senso-ji Temple",
        activityData: {
          name: "Senso-ji Temple",
          description: "Historic district and market walk.",
          category: "culture",
          duration: "2h",
          googleMapsUrl: "https://maps.google.com/?q=Senso-ji+Tokyo",
          imageUrl: null,
        },
      },
    });
    expect(mockPrisma.itinerary.updateMany).not.toHaveBeenCalled();
  });

  it("handles missing profileId and marks discovery complete on final swipe", async () => {
    await recordActivitySwipe({
      tripId: "trip-1",
      profileId: null,
      destination: "Tokyo",
      decision: "disliked",
      activity: {
        name: "Robot Restaurant",
        description: "High-energy show in Shinjuku.",
        category: "nightlife",
        duration: "1h 30m",
        googleMapsUrl: "https://maps.google.com/?q=Robot+Restaurant+Tokyo",
        imageUrl: null,
      },
      isFinal: true,
    });

    expect(mockPrisma.activitySwipe.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          profileId: null,
          decision: "disliked",
        }),
      })
    );
    expect(mockPrisma.itinerary.updateMany).toHaveBeenCalledWith({
      where: { tripId: "trip-1", isActive: true },
      data: { discoveryStatus: "completed" },
    });
  });
});
