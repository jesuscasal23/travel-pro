// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createGuestTripOwnerCookie } from "@/lib/api/guest-trip-ownership";

const mocks = vi.hoisted(() => ({
  createGeneratingRecord: vi.fn(),
  activateGeneratedItinerary: vi.fn(),
  markGenerationFailed: vi.fn(),
  prefetchFlightsForRoute: vi.fn(),
  GenerationAlreadyInProgressError: class GenerationAlreadyInProgressError extends Error {
    tripId: string;
    itineraryId: string;
    generationJobId?: string | null;

    constructor(tripId: string, itineraryId: string, generationJobId?: string | null) {
      super("Generation already in progress");
      this.name = "GenerationAlreadyInProgressError";
      this.tripId = tripId;
      this.itineraryId = itineraryId;
      this.generationJobId = generationJobId;
    }
  },
}));

vi.mock("@/lib/core/prisma", () => ({
  prisma: {
    profile: { findUnique: vi.fn() },
    trip: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/features/trips/itinerary-service", () => ({
  createGeneratingRecord: mocks.createGeneratingRecord,
  activateGeneratedItinerary: mocks.activateGeneratedItinerary,
  GenerationAlreadyInProgressError: mocks.GenerationAlreadyInProgressError,
  markGenerationFailed: mocks.markGenerationFailed,
}));

vi.mock("@/lib/flights", () => ({
  prefetchFlightsForRoute: mocks.prefetchFlightsForRoute,
}));

vi.mock("@/lib/core/supabase-server", () => ({
  getAuthenticatedUserId: vi.fn(),
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
import { POST } from "../route";

const mockPrisma = prisma as unknown as {
  profile: { findUnique: ReturnType<typeof vi.fn> };
  trip: { findUnique: ReturnType<typeof vi.fn> };
};
const mockAuth = getAuthenticatedUserId as ReturnType<typeof vi.fn>;

describe("POST /api/v1/trips/:id/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAuth.mockResolvedValue("user-1");
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
          interests: ["food"],
          activityLevel: "moderate",
          onboardingCompleted: true,
          languagesSpoken: [],
        };
      }

      return null;
    });
    mockPrisma.trip.findUnique.mockResolvedValue({
      id: "trip-1",
      profileId: "profile-1",
      tripType: "single-city",
      region: "",
      destination: "Lisbon",
      destinationCountry: "Portugal",
      destinationCountryCode: "PT",
      destinationLat: 38.72,
      destinationLng: -9.14,
      dateStart: "2026-06-01",
      dateEnd: "2026-06-10",
      flexibleDates: false,
      travelers: 2,
      description: null,
    });

    mocks.createGeneratingRecord.mockResolvedValue({ id: "itin-1" });
    mocks.activateGeneratedItinerary.mockResolvedValue(undefined);
    mocks.markGenerationFailed.mockResolvedValue(undefined);
    mocks.prefetchFlightsForRoute.mockResolvedValue(null);
  });

  it("returns 401 for user-owned trips when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/v1/trips/trip-1/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
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
          nationality: "French",
          homeAirport: "CDG",
          travelStyle: "luxury",
          interests: ["nightlife"],
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
      promptVersion: "skeleton-v1",
    });
    expect(mocks.activateGeneratedItinerary).toHaveBeenCalled();
  });

  it("falls back to client profile for guest-owned trips", async () => {
    const ownerCookie = createGuestTripOwnerCookie("trip-1");
    mockAuth.mockResolvedValue(null);
    mockPrisma.trip.findUnique.mockResolvedValue({
      id: "trip-1",
      profileId: null,
      tripType: "single-city",
      region: "",
      destination: "Lisbon",
      destinationCountry: "Portugal",
      destinationCountryCode: "PT",
      destinationLat: 38.72,
      destinationLng: -9.14,
      dateStart: "2026-06-01",
      dateEnd: "2026-06-10",
      flexibleDates: false,
      travelers: 2,
      description: null,
    });

    const req = new NextRequest("http://localhost:3000/api/v1/trips/trip-1/generate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${ownerCookie.name}=${ownerCookie.value}`,
      },
      body: JSON.stringify({
        profile: {
          nationality: "Spanish",
          homeAirport: "MAD",
          travelStyle: "comfort-explorer",
          interests: ["food"],
        },
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "trip-1" }) });
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(body).toContain('"stage":"done"');
  });

  it("returns 409 when a generation is already running for the trip", async () => {
    mocks.createGeneratingRecord.mockRejectedValue(
      new mocks.GenerationAlreadyInProgressError("trip-1", "itin-active", "job-active")
    );

    const req = new NextRequest("http://localhost:3000/api/v1/trips/trip-1/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        profile: {
          nationality: "German",
          homeAirport: "FRA",
          travelStyle: "smart-budget",
          interests: ["food"],
        },
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "trip-1" }) });
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toBe("Generation already in progress");
    expect(json.details).toEqual({
      itineraryId: "itin-active",
      generationJobId: "job-active",
    });
    expect(mocks.activateGeneratedItinerary).not.toHaveBeenCalled();
  });

  it("marks the itinerary as failed and closes the stream when flight prefetch throws an abort", async () => {
    const aborted = new Error("Request aborted");
    aborted.name = "AbortError";
    mocks.prefetchFlightsForRoute.mockRejectedValue(aborted);

    const req = new NextRequest("http://localhost:3000/api/v1/trips/trip-1/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "trip-1" }) });
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(body).not.toContain('"stage":"error"');
    expect(mocks.markGenerationFailed).toHaveBeenCalledWith("itin-1");
    expect(mocks.activateGeneratedItinerary).not.toHaveBeenCalled();
  });
});
