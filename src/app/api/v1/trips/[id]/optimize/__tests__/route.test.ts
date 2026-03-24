// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/core/prisma", () => ({
  prisma: {
    profile: { findUnique: vi.fn() },
    trip: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/core/supabase-server", () => ({
  getAuthenticatedUserId: vi.fn(),
}));

vi.mock("@/lib/flights", () => ({
  optimizeFlightsForTrip: vi.fn(),
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
import { optimizeFlightsForTrip } from "@/lib/flights";
import { POST } from "../route";

const mockPrisma = prisma as unknown as {
  profile: { findUnique: ReturnType<typeof vi.fn> };
  trip: { findUnique: ReturnType<typeof vi.fn> };
};
const mockAuth = getAuthenticatedUserId as ReturnType<typeof vi.fn>;
const mockOptimizeFlightsForTrip = optimizeFlightsForTrip as ReturnType<typeof vi.fn>;

const baseBody = {
  homeAirport: "FRA - Frankfurt",
  route: [
    {
      id: "tokyo",
      city: "Tokyo",
      country: "Japan",
      countryCode: "JP",
      lat: 35.68,
      lng: 139.69,
      days: 4,
      iataCode: "NRT",
    },
    {
      id: "hanoi",
      city: "Hanoi",
      country: "Vietnam",
      countryCode: "VN",
      lat: 21.03,
      lng: 105.85,
      days: 3,
    },
  ],
  dateStart: "2026-04-01",
  dateEnd: "2026-04-08",
  travelers: 2,
};

function makeRequest(body: object) {
  return new NextRequest("http://localhost:3000/api/v1/trips/trip-1/optimize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue("user-1");
  mockPrisma.profile.findUnique.mockResolvedValue({ id: "profile-1", userId: "user-1" });
  mockPrisma.trip.findUnique.mockResolvedValue({ id: "trip-1", profileId: "profile-1" });
  mockOptimizeFlightsForTrip.mockResolvedValue({
    legs: [{ fromIata: "FRA", toIata: "NRT", price: 500 }],
    totalPrice: 500,
  });
});

describe("POST /api/v1/trips/:id/optimize", () => {
  it("returns optimized skeleton", async () => {
    const req = makeRequest(baseBody);
    const res = await POST(req, { params: Promise.resolve({ id: "trip-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockOptimizeFlightsForTrip).toHaveBeenCalledWith(
      expect.objectContaining({
        homeAirport: "FRA - Frankfurt",
        dateStart: "2026-04-01",
        dateEnd: "2026-04-08",
        travelers: 2,
      })
    );
    expect(json.skeleton.totalPrice).toBe(500);
  });

  it("returns 400 when facade throws BadRequestError for IATA resolution", async () => {
    const { BadRequestError } = await import("@/lib/api/errors");
    mockOptimizeFlightsForTrip.mockRejectedValue(
      new BadRequestError("Could not parse home airport IATA code")
    );
    const req = makeRequest(baseBody);

    const res = await POST(req, { params: Promise.resolve({ id: "trip-1" }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Could not parse home airport IATA code");
  });

  it("returns 502 when facade throws UpstreamServiceError", async () => {
    const { UpstreamServiceError } = await import("@/lib/api/errors");
    mockOptimizeFlightsForTrip.mockRejectedValue(
      new UpstreamServiceError(
        "Flight optimization failed — SerpApi may not be configured or available"
      )
    );
    const req = makeRequest(baseBody);

    const res = await POST(req, { params: Promise.resolve({ id: "trip-1" }) });
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.error).toContain("Flight optimization failed");
  });
});
