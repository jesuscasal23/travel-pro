// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/core/prisma", () => ({
  prisma: {
    profile: { findUnique: vi.fn() },
    trip: { findUnique: vi.fn() },
    discoveredActivity: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/core/supabase-server", () => ({
  getAuthenticatedUserId: vi.fn(),
}));

vi.mock("@/lib/features/trips/discover-activities-service", () => ({
  discoverActivities: vi.fn(),
}));

vi.mock("@/lib/features/trips/itinerary-service", () => ({
  findActiveItinerary: vi.fn(),
}));

vi.mock("@/lib/core/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock("@/lib/core/request-context", () => ({
  requestContext: {
    run: (_ctx: unknown, fn: () => unknown) => fn(),
  },
}));

import { prisma } from "@/lib/core/prisma";
import { getAuthenticatedUserId } from "@/lib/core/supabase-server";
import { discoverActivities } from "@/lib/features/trips/discover-activities-service";
import { findActiveItinerary } from "@/lib/features/trips/itinerary-service";
import { POST } from "../route";

const mockPrisma = prisma as unknown as {
  profile: { findUnique: ReturnType<typeof vi.fn> };
  trip: { findUnique: ReturnType<typeof vi.fn> };
  discoveredActivity: {
    findMany: ReturnType<typeof vi.fn>;
    createMany: ReturnType<typeof vi.fn>;
  };
};
const mockAuth = getAuthenticatedUserId as ReturnType<typeof vi.fn>;
const mockDiscover = discoverActivities as ReturnType<typeof vi.fn>;
const mockFindActiveItinerary = findActiveItinerary as ReturnType<typeof vi.fn>;

function makeRequest(body: object, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/v1/trips/trip-1/discover-activities", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue("user-1");
  mockPrisma.trip.findUnique.mockResolvedValue({ profileId: "profile-1" });
  mockPrisma.discoveredActivity.findMany.mockResolvedValue([]);
  mockPrisma.discoveredActivity.createMany.mockResolvedValue({ count: 1 });
  mockPrisma.profile.findUnique.mockImplementation(async ({ where }) => {
    if ("userId" in where) {
      return { id: "profile-1", userId: "user-1" };
    }
    if ("id" in where) {
      return {
        id: "profile-1",
        userId: "user-1",
        nationality: "German",
        homeAirport: "FRA",
        travelStyle: "smart-budget",
        interests: ["culture", "food"],
        activityLevel: "moderate",
        onboardingCompleted: true,
        languagesSpoken: [],
      };
    }
    return null;
  });
  mockFindActiveItinerary.mockResolvedValue({
    id: "itin-1",
    discoveryStatus: "pending",
    data: {
      route: [
        {
          id: "tokyo",
          city: "Tokyo",
          country: "Japan",
          countryCode: "JP",
          lat: 35.6762,
          lng: 139.6503,
          days: 3,
          iataCode: "HND",
        },
      ],
      days: [],
    },
  });
  mockDiscover.mockResolvedValue({
    activities: [
      {
        name: "Senso-ji Temple",
        description: "A historic temple district with street food and local culture.",
        category: "culture",
        duration: "2h",
        googleMapsUrl: "https://maps.google.com/?q=Senso-ji+Tokyo",
        imageUrl: null,
      },
    ],
    roundLimitReached: false,
    reachability: { filtered: 0, verifiedFiltered: 0, autoRegenerated: false },
  });
});

describe("POST /api/v1/trips/:id/discover-activities", () => {
  it("returns 401 for unauthenticated users", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest({ cityId: "tokyo" }), {
      params: Promise.resolve({ id: "trip-1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns validated activities for authenticated owners", async () => {
    const res = await POST(makeRequest({ cityId: "tokyo" }), {
      params: Promise.resolve({ id: "trip-1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(json.activities)).toBe(true);
    expect(json.activities).toHaveLength(1);
    expect(mockDiscover).toHaveBeenCalledWith({
      tripId: "trip-1",
      profileId: "profile-1",
      profile: {
        nationality: "German",
        homeAirport: "FRA",
        travelStyle: "smart-budget",
        interests: ["culture", "food"],
        pace: "moderate",
      },
      cityId: "tokyo",
      signal: expect.any(AbortSignal),
    });
  });

  it("returns deterministic fixture activities for E2E requests without calling Claude discovery", async () => {
    mockPrisma.discoveredActivity.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: "activity-1",
        cityId: "tokyo",
        city: "Tokyo",
        name: "Tokyo Old Quarter Walk",
        placeName: "Tokyo Historic Center",
        venueType: "neighborhood",
        description: "A relaxed walk through the most characterful streets, landmarks, and cafes.",
        highlights: ["Easy first-day activity", "Great for orientation", "Photo-friendly route"],
        category: "culture",
        duration: "2h",
        googleMapsUrl: "https://maps.google.com/?q=Tokyo+Old+Quarter+Walk",
        googlePlaceId: "e2e-tokyo-old-quarter-walk",
        imageUrl: null,
        imageUrls: [],
        lat: 35.6842,
        lng: 139.6563,
        decision: null,
        decidedAt: null,
        assignedDay: null,
        assignedOrder: null,
      },
    ]);

    const res = await POST(makeRequest({ cityId: "tokyo" }, { "x-e2e-test": "1" }), {
      params: Promise.resolve({ id: "trip-1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.activities).toHaveLength(1);
    expect(json.activities[0].name).toBe("Tokyo Old Quarter Walk");
    expect(json.activities[0].reachableMinutes).toEqual(expect.any(Number));
    expect(json.roundLimitReached).toBe(false);
    expect(mockPrisma.discoveredActivity.createMany).toHaveBeenCalledTimes(1);
    expect(mockDiscover).not.toHaveBeenCalled();
  });
});
