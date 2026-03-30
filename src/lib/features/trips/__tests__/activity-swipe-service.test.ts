import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CityStop } from "@/types";

const mockItineraryData = {
  route: [
    {
      id: "city-1",
      city: "Tokyo",
      country: "Japan",
      lat: 35.6,
      lng: 139.6,
      days: 3,
      countryCode: "JP",
    },
    {
      id: "city-2",
      city: "Osaka",
      country: "Japan",
      lat: 34.6,
      lng: 135.5,
      days: 2,
      countryCode: "JP",
    },
  ] satisfies CityStop[],
  days: [],
};

vi.mock("@/lib/core/prisma", () => ({
  prisma: {
    discoveredActivity: {
      update: vi.fn(),
      count: vi.fn(),
    },
    itinerary: { updateMany: vi.fn() },
    trip: { findUniqueOrThrow: vi.fn() },
    profile: { findUnique: vi.fn() },
  },
}));

vi.mock("../itinerary-service", () => ({
  findActiveItinerary: vi.fn(),
}));

vi.mock("@/lib/utils/trip/trip-metadata", () => ({
  parseItineraryData: vi.fn(),
}));

vi.mock("../activity-assignment-service", () => ({
  assignActivitiesToDays: vi.fn(),
}));

import { prisma } from "@/lib/core/prisma";
import { findActiveItinerary } from "../itinerary-service";
import { parseItineraryData } from "@/lib/utils/trip/trip-metadata";
import { recordActivitySwipe } from "../activity-swipe-service";

const mockPrisma = prisma as unknown as {
  discoveredActivity: {
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  itinerary: { updateMany: ReturnType<typeof vi.fn> };
  trip: { findUniqueOrThrow: ReturnType<typeof vi.fn> };
  profile: { findUnique: ReturnType<typeof vi.fn> };
};

describe("recordActivitySwipe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.discoveredActivity.update.mockResolvedValue({
      id: "activity-1",
      decision: "liked",
    });
    (findActiveItinerary as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-1",
      data: mockItineraryData,
      version: 1,
    });
    (parseItineraryData as ReturnType<typeof vi.fn>).mockReturnValue(mockItineraryData);
    mockPrisma.trip.findUniqueOrThrow.mockResolvedValue({ profileId: "profile-1" });
    mockPrisma.profile.findUnique.mockResolvedValue({ activityLevel: "moderate" });
  });

  it("updates the discovered activity decision and returns city progress", async () => {
    // 1 liked so far, need 6 (2 non-travel days × 3 activities/day for moderate)
    mockPrisma.discoveredActivity.count
      .mockResolvedValueOnce(1) // liked count for city
      .mockResolvedValueOnce(10); // unswiped count

    const result = await recordActivitySwipe({
      tripId: "trip-1",
      activityId: "activity-1",
      decision: "liked",
      cityId: "city-1",
    });

    expect(mockPrisma.discoveredActivity.update).toHaveBeenCalledWith({
      where: { id: "activity-1" },
      data: { decision: "liked", decidedAt: expect.any(Date) },
    });
    expect(result.cityProgress.cityId).toBe("city-1");
    expect(result.cityProgress.likedCount).toBe(1);
    expect(result.allCitiesComplete).toBe(false);
  });
});
