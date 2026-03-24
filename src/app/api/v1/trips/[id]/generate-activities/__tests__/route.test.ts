// @vitest-environment node
// ============================================================
// Unit tests for POST /api/v1/trips/[id]/generate-activities
//
// Verifies:
//   - Returns full merged itinerary (not just days) on success
//   - Merges generated activities into the correct city days
//   - Returns existing itinerary (idempotent) when activities already exist
//   - Returns 404 when trip or itinerary not found
//   - Returns 400 when cityId doesn't exist in route
//   - Persists merged itinerary to DB
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { Itinerary, TripDay } from "@/types";
import { createGuestTripOwnerCookie } from "@/lib/api/guest-trip-ownership";

// ── Mocks ─────────────────────────────────────────────────────

vi.mock("@/lib/core/prisma", () => ({
  prisma: {
    profile: { findUnique: vi.fn() },
    trip: { findUnique: vi.fn() },
    itinerary: { update: vi.fn() },
  },
}));

vi.mock("@/lib/features/trips/itinerary-service", () => ({
  findActiveItinerary: vi.fn(),
}));

vi.mock("@/lib/ai/pipeline", () => ({
  generateCityActivities: vi.fn(),
}));

vi.mock("@/lib/features/trips/trip-query-service", () => ({
  loadTripContext: vi.fn().mockResolvedValue({
    trip: {
      id: "trip-1",
      tripType: "multi-city",
      region: "east-asia",
      dateStart: "2026-10-01",
      dateEnd: "2026-10-08",
      travelers: 2,
    },
    intent: {
      id: "trip-1",
      tripType: "multi-city",
      region: "east-asia",
      dateStart: "2026-10-01",
      dateEnd: "2026-10-08",
      travelers: 2,
    },
  }),
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

vi.mock("@/lib/core/supabase-server", () => ({
  getAuthenticatedUserId: vi.fn().mockResolvedValue(null),
}));

import { prisma } from "@/lib/core/prisma";
import { getAuthenticatedUserId } from "@/lib/core/supabase-server";
import { findActiveItinerary } from "@/lib/features/trips/itinerary-service";
import { generateCityActivities } from "@/lib/ai/pipeline";
import { POST } from "../route";

const mockPrisma = prisma as unknown as {
  profile: { findUnique: ReturnType<typeof vi.fn> };
  trip: { findUnique: ReturnType<typeof vi.fn> };
  itinerary: { update: ReturnType<typeof vi.fn> };
};
const mockAuth = getAuthenticatedUserId as ReturnType<typeof vi.fn>;
const mockFindActive = findActiveItinerary as ReturnType<typeof vi.fn>;
const mockGenerateActivities = generateCityActivities as ReturnType<typeof vi.fn>;

// ── Fixtures ──────────────────────────────────────────────────

const routeOnlyItinerary: Itinerary = {
  route: [
    {
      id: "tokyo",
      city: "Tokyo",
      country: "Japan",
      lat: 35.68,
      lng: 139.69,
      days: 3,
      countryCode: "JP",
    },
    {
      id: "kyoto",
      city: "Kyoto",
      country: "Japan",
      lat: 35.01,
      lng: 135.77,
      days: 2,
      countryCode: "JP",
    },
  ],
  days: [
    { day: 1, date: "Oct 1", city: "Tokyo", activities: [] },
    { day: 2, date: "Oct 2", city: "Tokyo", activities: [] },
    { day: 3, date: "Oct 3", city: "Tokyo", activities: [] },
    { day: 4, date: "Oct 4", city: "Kyoto", activities: [] },
    { day: 5, date: "Oct 5", city: "Kyoto", activities: [] },
  ],
};

const generatedTokyoDays: TripDay[] = [
  {
    day: 1,
    date: "Oct 1",
    city: "Tokyo",
    activities: [{ name: "Senso-ji", category: "culture", why: "Historic temple", duration: "2h" }],
  },
  {
    day: 2,
    date: "Oct 2",
    city: "Tokyo",
    activities: [{ name: "Shibuya", category: "explore", why: "Iconic crossing", duration: "3h" }],
  },
  {
    day: 3,
    date: "Oct 3",
    city: "Tokyo",
    activities: [{ name: "Tsukiji", category: "food", why: "Fresh sushi", duration: "2h" }],
  },
];

const mockTrip = {
  id: "trip-1",
  profileId: null,
  tripType: "multi-city",
  region: "east-asia",
  dateStart: "2026-10-01",
  dateEnd: "2026-10-08",
  travelers: 2,
};

const validProfile = {
  nationality: "German",
  homeAirport: "FRA",
  travelStyle: "smart-budget",
  interests: ["culture", "food"],
};

// ── Helpers ───────────────────────────────────────────────────

function makeRequest(body: object): NextRequest {
  const ownerCookie = createGuestTripOwnerCookie("trip-1");

  return new NextRequest("http://localhost:3000/api/v1/trips/trip-1/generate-activities", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: `${ownerCookie.name}=${ownerCookie.value}`,
    },
    body: JSON.stringify(body),
  });
}

async function callPOST(body: object) {
  const req = makeRequest(body);
  return POST(req, { params: Promise.resolve({ id: "trip-1" }) });
}

// ── Tests ─────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(null);
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
  mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
  mockFindActive.mockResolvedValue({ id: "itin-1", data: routeOnlyItinerary });
  mockGenerateActivities.mockResolvedValue(generatedTokyoDays);
  mockPrisma.itinerary.update.mockResolvedValue({});
});

describe("POST /api/v1/trips/:id/generate-activities", () => {
  it("loads the stored profile for authenticated trips", async () => {
    mockAuth.mockResolvedValue("user-1");
    mockPrisma.trip.findUnique.mockResolvedValue({
      ...mockTrip,
      profileId: "profile-1",
    });

    const req = new NextRequest("http://localhost:3000/api/v1/trips/trip-1/generate-activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cityId: "tokyo" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "trip-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.itinerary).toBeDefined();
    expect(mockGenerateActivities).toHaveBeenCalledWith(
      {
        nationality: "German",
        homeAirport: "FRA",
        travelStyle: "smart-budget",
        interests: ["culture", "food"],
        pace: "moderate",
      },
      expect.any(Object),
      expect.any(Object),
      "tokyo",
      expect.any(Object)
    );
  });

  it("returns full merged itinerary with activities populated for the target city", async () => {
    const res = await callPOST({ profile: validProfile, cityId: "tokyo" });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.itinerary).toBeDefined();
    expect(json.itinerary.route).toHaveLength(2);
    expect(json.itinerary.days).toHaveLength(5);

    // Tokyo days should have activities
    const tokyoDays = json.itinerary.days.filter((d: TripDay) => d.city === "Tokyo");
    expect(tokyoDays).toHaveLength(3);
    expect(tokyoDays[0].activities).toHaveLength(1);
    expect(tokyoDays[0].activities[0].name).toBe("Senso-ji");

    // Kyoto days should remain empty
    const kyotoDays = json.itinerary.days.filter((d: TripDay) => d.city === "Kyoto");
    expect(kyotoDays).toHaveLength(2);
    expect(kyotoDays[0].activities).toHaveLength(0);
  });

  it("persists the merged itinerary to the database", async () => {
    await callPOST({ profile: validProfile, cityId: "tokyo" });

    expect(mockPrisma.itinerary.update).toHaveBeenCalledTimes(1);
    const updateCall = mockPrisma.itinerary.update.mock.calls[0][0];
    expect(updateCall.where.id).toBe("itin-1");

    const saved = updateCall.data.data as Itinerary;
    const tokyoDays = saved.days.filter((d: TripDay) => d.city === "Tokyo");
    expect(tokyoDays[0].activities).toHaveLength(1);
  });

  it("returns existing itinerary without re-generating when activities already exist (idempotent)", async () => {
    const itineraryWithActivities: Itinerary = {
      ...routeOnlyItinerary,
      days: routeOnlyItinerary.days.map((d) =>
        d.city === "Tokyo" && d.day === 1
          ? {
              ...d,
              activities: [
                { name: "Existing", category: "culture", why: "Already there", duration: "1h" },
              ],
            }
          : d
      ),
    };
    mockFindActive.mockResolvedValue({ id: "itin-1", data: itineraryWithActivities });

    const res = await callPOST({ profile: validProfile, cityId: "tokyo" });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.itinerary).toBeDefined();
    expect(
      json.itinerary.days.find((d: TripDay) => d.city === "Tokyo" && d.day === 1).activities[0].name
    ).toBe("Existing");
    expect(mockGenerateActivities).not.toHaveBeenCalled();
  });

  it("returns 404 when trip does not exist", async () => {
    mockPrisma.trip.findUnique.mockResolvedValue(null);

    const res = await callPOST({ profile: validProfile, cityId: "tokyo" });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("Trip not found");
  });

  it("returns 404 when no active itinerary exists", async () => {
    mockFindActive.mockResolvedValue(null);

    const res = await callPOST({ profile: validProfile, cityId: "tokyo" });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("No active itinerary found");
  });

  it("returns 400 when cityId is not in the route", async () => {
    const res = await callPOST({ profile: validProfile, cityId: "osaka" });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("not found in itinerary route");
  });

  it("returns 400 when request body is invalid", async () => {
    const res = await callPOST({ cityId: "tokyo" }); // missing profile
    expect(res.status).toBe(400);
  });

  it("preserves non-target city data in the merged itinerary", async () => {
    const res = await callPOST({ profile: validProfile, cityId: "tokyo" });
    const json = await res.json();

    // Kyoto days should be completely untouched
    const kyotoDays = json.itinerary.days.filter((d: TripDay) => d.city === "Kyoto");
    expect(kyotoDays).toEqual(routeOnlyItinerary.days.filter((d) => d.city === "Kyoto"));
  });

  it("only merges activities for matching day numbers", async () => {
    // AI returns only days 1 and 3, skipping day 2
    mockGenerateActivities.mockResolvedValue([
      {
        day: 1,
        date: "Oct 1",
        city: "Tokyo",
        activities: [{ name: "A", category: "explore", why: "Good", duration: "1h" }],
      },
      {
        day: 3,
        date: "Oct 3",
        city: "Tokyo",
        activities: [{ name: "B", category: "food", why: "Tasty", duration: "2h" }],
      },
    ]);

    const res = await callPOST({ profile: validProfile, cityId: "tokyo" });
    const json = await res.json();

    const tokyoDays = json.itinerary.days.filter((d: TripDay) => d.city === "Tokyo");
    expect(tokyoDays[0].activities).toHaveLength(1); // day 1 — merged
    expect(tokyoDays[1].activities).toHaveLength(0); // day 2 — no match, stays empty
    expect(tokyoDays[2].activities).toHaveLength(1); // day 3 — merged
  });
});
