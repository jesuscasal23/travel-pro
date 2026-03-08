// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { Itinerary } from "@/types";

const mocks = vi.hoisted(() => ({
  generateRouteOnly: vi.fn(),
  createGeneratingRecord: vi.fn(),
  activateGeneratedItinerary: vi.fn(),
  markGenerationFailed: vi.fn(),
  prefetchFlightOptions: vi.fn(),
  parseIataCode: vi.fn(),
  lookupIata: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    profile: { findUnique: vi.fn() },
    trip: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/ai/pipeline", () => ({
  generateRouteOnly: mocks.generateRouteOnly,
}));

vi.mock("@/lib/services/itinerary-service", () => ({
  createGeneratingRecord: mocks.createGeneratingRecord,
  activateGeneratedItinerary: mocks.activateGeneratedItinerary,
  markGenerationFailed: mocks.markGenerationFailed,
}));

vi.mock("@/lib/flights/amadeus", () => ({
  prefetchFlightOptions: mocks.prefetchFlightOptions,
}));

vi.mock("@/lib/affiliate/link-generator", () => ({
  parseIataCode: mocks.parseIataCode,
}));

vi.mock("@/lib/flights/city-iata-map", () => ({
  lookupIata: mocks.lookupIata,
}));

vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUserId: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock("@/lib/request-context", () => ({
  requestContext: {
    run: (_ctx: unknown, fn: () => unknown) => fn(),
  },
}));

import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUserId } from "@/lib/supabase/server";
import { POST } from "../route";

const mockPrisma = prisma as unknown as {
  profile: { findUnique: ReturnType<typeof vi.fn> };
  trip: { findUnique: ReturnType<typeof vi.fn> };
};
const mockAuth = getAuthenticatedUserId as ReturnType<typeof vi.fn>;

const itinerary: Itinerary = {
  route: [
    {
      id: "lisbon",
      city: "Lisbon",
      country: "Portugal",
      countryCode: "PT",
      lat: 1,
      lng: 2,
      days: 2,
      iataCode: "LIS",
    },
  ],
  days: [{ day: 1, date: "2026-06-01", city: "Lisbon", activities: [] }],
};

describe("POST /api/v1/trips/:id/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAuth.mockResolvedValue("user-1");
    mockPrisma.profile.findUnique.mockResolvedValue({ id: "profile-1", userId: "user-1" });
    mockPrisma.trip.findUnique.mockResolvedValue({
      id: "trip-1",
      profileId: "profile-1",
      tripType: "multi-city",
      region: "europe",
      destination: null,
      destinationCountry: null,
      destinationCountryCode: null,
      dateStart: "2026-06-01",
      dateEnd: "2026-06-10",
      flexibleDates: false,
      travelers: 2,
      description: null,
    });

    mocks.createGeneratingRecord.mockResolvedValue({ id: "itin-1" });
    mocks.activateGeneratedItinerary.mockResolvedValue(undefined);
    mocks.markGenerationFailed.mockResolvedValue(undefined);
    mocks.generateRouteOnly.mockResolvedValue(itinerary);
    mocks.parseIataCode.mockReturnValue("FRA");
    mocks.lookupIata.mockReturnValue("LIS");
    mocks.prefetchFlightOptions.mockResolvedValue([]);
  });

  it("returns 401 for user-owned trips when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/v1/trips/trip-1/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        profile: {
          nationality: "German",
          homeAirport: "FRA",
          travelStyle: "comfort",
          interests: ["food"],
        },
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "trip-1" }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("streams generation progress and completes successfully", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/trips/trip-1/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        profile: {
          nationality: "German",
          homeAirport: "FRA",
          travelStyle: "comfort",
          interests: ["food"],
        },
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "trip-1" }) });
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    expect(body).toContain('"stage":"done"');
    expect(mocks.createGeneratingRecord).toHaveBeenCalledWith({
      tripId: "trip-1",
      promptVersion: "v1",
    });
    expect(mocks.activateGeneratedItinerary).toHaveBeenCalled();
  });
});
