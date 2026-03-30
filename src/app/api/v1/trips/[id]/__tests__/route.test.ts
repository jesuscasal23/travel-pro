// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { Itinerary } from "@/types";

vi.mock("@/lib/core/prisma", () => ({
  prisma: {
    profile: { findUnique: vi.fn() },
    trip: { findUnique: vi.fn(), delete: vi.fn() },
  },
}));

vi.mock("@/lib/features/trips/trip-collection-service", () => ({
  deleteTripById: vi.fn(),
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
import { deleteTripById } from "@/lib/features/trips/trip-collection-service";
import { createGuestTripOwnerCookie } from "@/lib/api/guest-trip-ownership";
import { GET, DELETE } from "../route";

const mockPrisma = prisma as unknown as {
  profile: { findUnique: ReturnType<typeof vi.fn> };
  trip: {
    findUnique: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};
const mockAuth = getAuthenticatedUserId as ReturnType<typeof vi.fn>;
const mockDeleteTripById = deleteTripById as ReturnType<typeof vi.fn>;

const tripId = "trip-1";
const profileId = "profile-1";

const itineraryData: Itinerary = {
  route: [],
  days: [],
};

function makeGetRequest(headers?: HeadersInit) {
  return new NextRequest(`http://localhost:3000/api/v1/trips/${tripId}`, {
    method: "GET",
    headers,
  });
}

function makeDeleteRequest() {
  return new NextRequest(`http://localhost:3000/api/v1/trips/${tripId}`, {
    method: "DELETE",
  });
}

function makeSignedGuestCookieHeader() {
  const cookie = createGuestTripOwnerCookie(tripId);
  return { cookie: `${cookie.name}=${cookie.value}` };
}

beforeEach(() => {
  vi.clearAllMocks();

  mockAuth.mockResolvedValue("user-1");
  mockPrisma.profile.findUnique.mockResolvedValue({ id: profileId, userId: "user-1" });
  mockPrisma.trip.findUnique.mockResolvedValue({ id: tripId, profileId });
  mockDeleteTripById.mockResolvedValue({ success: true });
});

describe("GET /api/v1/trips/:id", () => {
  it("returns 403 for guest trips without the owner cookie", async () => {
    mockPrisma.trip.findUnique.mockResolvedValueOnce({ id: tripId, profileId: null });

    const res = await GET(makeGetRequest(), { params: Promise.resolve({ id: tripId }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toBe("Forbidden");
  });

  it("returns the guest trip when the signed owner cookie is present", async () => {
    mockAuth.mockResolvedValue(null);
    mockPrisma.trip.findUnique
      .mockResolvedValueOnce({ id: tripId, profileId: null })
      .mockResolvedValueOnce({
        id: tripId,
        profileId: null,
        tripType: "multi-city",
        region: "europe",
        destination: null,
        destinationCountry: null,
        destinationCountryCode: null,
        dateStart: "2026-06-01",
        dateEnd: "2026-06-10",
        travelers: 2,
        description: null,
        itineraries: [
          {
            id: "itin-1",
            data: itineraryData,
          },
        ],
        discoveredActivities: [],
      });

    const res = await GET(makeGetRequest(makeSignedGuestCookieHeader()), {
      params: Promise.resolve({ id: tripId }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.trip.id).toBe(tripId);
    expect(json.trip.itineraries[0].data).toEqual(itineraryData);
  });
});

describe("DELETE /api/v1/trips/:id", () => {
  it("deletes the trip for the owner", async () => {
    const req = makeDeleteRequest();

    const res = await DELETE(req, { params: Promise.resolve({ id: tripId }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ success: true });
    expect(mockDeleteTripById).toHaveBeenCalledWith(tripId);
  });
});
