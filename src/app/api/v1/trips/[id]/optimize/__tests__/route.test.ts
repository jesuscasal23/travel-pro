// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/core/prisma", () => ({
  prisma: {
    profile: { findUnique: vi.fn() },
    trip: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUserId: vi.fn(),
}));

vi.mock("@/lib/flights/optimizer", () => ({
  optimizeFlights: vi.fn(),
}));

vi.mock("@/lib/affiliate/link-generator", () => ({
  parseIataCode: vi.fn(),
}));

vi.mock("@/lib/flights/city-iata-map", () => ({
  lookupIata: vi.fn(),
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
import { getAuthenticatedUserId } from "@/lib/supabase/server";
import { optimizeFlights } from "@/lib/flights/optimizer";
import { parseIataCode } from "@/lib/affiliate/link-generator";
import { lookupIata } from "@/lib/flights/city-iata-map";
import { POST } from "../route";

const mockPrisma = prisma as unknown as {
  profile: { findUnique: ReturnType<typeof vi.fn> };
  trip: { findUnique: ReturnType<typeof vi.fn> };
};
const mockAuth = getAuthenticatedUserId as ReturnType<typeof vi.fn>;
const mockOptimizeFlights = optimizeFlights as ReturnType<typeof vi.fn>;
const mockParseIataCode = parseIataCode as ReturnType<typeof vi.fn>;
const mockLookupIata = lookupIata as ReturnType<typeof vi.fn>;

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
  mockParseIataCode.mockReturnValue("FRA");
  mockLookupIata.mockImplementation((city: string) => (city === "Hanoi" ? "HAN" : null));
  mockOptimizeFlights.mockResolvedValue({
    legs: [{ fromIata: "FRA", toIata: "NRT", price: 500 }],
    totalPrice: 500,
  });
});

describe("POST /api/v1/trips/:id/optimize", () => {
  it("resolves missing city IATA codes and returns optimized skeleton", async () => {
    const req = makeRequest(baseBody);
    const res = await POST(req, { params: Promise.resolve({ id: "trip-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockOptimizeFlights).toHaveBeenCalledWith(
      "FRA",
      expect.arrayContaining([
        expect.objectContaining({ city: "Tokyo", iataCode: "NRT", minDays: 3, maxDays: 5 }),
        expect.objectContaining({ city: "Hanoi", iataCode: "HAN", minDays: 2, maxDays: 4 }),
      ]),
      "2026-04-01",
      7,
      2
    );
    expect(json.skeleton.totalPrice).toBe(500);
  });

  it("returns 400 when home airport IATA cannot be parsed", async () => {
    mockParseIataCode.mockReturnValue(null);
    const req = makeRequest(baseBody);

    const res = await POST(req, { params: Promise.resolve({ id: "trip-1" }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Could not parse home airport IATA code");
  });

  it("returns 400 when a city IATA cannot be resolved", async () => {
    mockLookupIata.mockReturnValue(null);
    const req = makeRequest(baseBody);

    const res = await POST(req, { params: Promise.resolve({ id: "trip-1" }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Could not resolve IATA codes");
    expect(json.error).toContain("Hanoi");
  });

  it("returns 502 when optimizer throws", async () => {
    mockOptimizeFlights.mockRejectedValue(new Error("amadeus down"));
    const req = makeRequest(baseBody);

    const res = await POST(req, { params: Promise.resolve({ id: "trip-1" }) });
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.error).toContain("Flight optimization failed");
  });
});
