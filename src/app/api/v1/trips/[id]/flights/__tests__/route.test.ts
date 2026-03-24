// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createGuestTripOwnerCookie } from "@/lib/api/guest-trip-ownership";

vi.mock("@/lib/core/prisma", () => ({
  prisma: {
    trip: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/flights", () => ({
  searchFlightLeg: vi.fn(),
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
import { searchFlightLeg } from "@/lib/flights";
import { POST } from "../route";

const mockPrisma = prisma as unknown as {
  trip: { findUnique: ReturnType<typeof vi.fn> };
};
const mockSearch = searchFlightLeg as ReturnType<typeof vi.fn>;

const tripId = "trip-123";

function makeRequest(body: object) {
  const ownerCookie = createGuestTripOwnerCookie(tripId);

  return new NextRequest(`http://localhost:3000/api/v1/trips/${tripId}/flights`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: `${ownerCookie.name}=${ownerCookie.value}`,
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  fromIata: "CDG",
  toIata: "NRT",
  departureDate: "2026-06-01",
  travelers: 2,
};

const mockResults = {
  fromIata: "CDG",
  toIata: "NRT",
  departureDate: "2026-06-01",
  fetchedAt: Date.now(),
  results: [
    {
      price: 320,
      duration: "16h",
      airline: "TK",
      stops: 1,
      departureTime: "2026-06-01T06:00:00",
      arrivalTime: "2026-06-01T22:00:00",
      cabin: "ECONOMY",
      bookingUrl: "https://skyscanner.net/flights/CDG/NRT",
    },
    {
      price: 450,
      duration: "12h 30m",
      airline: "LH",
      stops: 0,
      departureTime: "2026-06-01T08:30:00",
      arrivalTime: "2026-06-01T20:00:00",
      cabin: "ECONOMY",
      bookingUrl: "https://skyscanner.net/flights/CDG/NRT",
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.trip.findUnique.mockResolvedValue({ id: tripId });
  mockSearch.mockResolvedValue(mockResults);
});

describe("POST /api/v1/trips/:id/flights", () => {
  it("returns flight search results for valid request", async () => {
    const req = makeRequest(validBody);
    const res = await POST(req, { params: Promise.resolve({ id: tripId }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.results).toHaveLength(2);
    expect(json.fromIata).toBe("CDG");
    expect(json.toIata).toBe("NRT");
    expect(json.departureDate).toBe("2026-06-01");
    expect(json.fetchedAt).toBeGreaterThan(0);
  });

  it("calls searchFlightLeg with correct params", async () => {
    const req = makeRequest(validBody);
    await POST(req, { params: Promise.resolve({ id: tripId }) });

    expect(mockSearch).toHaveBeenCalledWith({
      fromIata: "CDG",
      toIata: "NRT",
      departureDate: "2026-06-01",
      travelers: 2,
      nonStop: undefined,
      maxPrice: undefined,
    });
  });

  it("returns 404 when trip not found", async () => {
    mockPrisma.trip.findUnique.mockResolvedValue(null);
    const req = makeRequest(validBody);
    const res = await POST(req, { params: Promise.resolve({ id: "no-such-trip" }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("Trip not found");
  });

  it("returns 400 for invalid IATA code length", async () => {
    const req = makeRequest({ ...validBody, fromIata: "AB" });
    const res = await POST(req, { params: Promise.resolve({ id: tripId }) });

    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid date format", async () => {
    const req = makeRequest({ ...validBody, departureDate: "01-06-2026" });
    const res = await POST(req, { params: Promise.resolve({ id: tripId }) });

    expect(res.status).toBe(400);
  });

  it("returns 400 for travelers out of range", async () => {
    const req = makeRequest({ ...validBody, travelers: 0 });
    const res = await POST(req, { params: Promise.resolve({ id: tripId }) });

    expect(res.status).toBe(400);
  });

  it("returns 400 for missing fields", async () => {
    const req = makeRequest({ fromIata: "CDG" });
    const res = await POST(req, { params: Promise.resolve({ id: tripId }) });

    expect(res.status).toBe(400);
  });

  it("returns empty results when flight provider is unconfigured", async () => {
    mockSearch.mockResolvedValue({
      fromIata: "CDG",
      toIata: "NRT",
      departureDate: "2026-06-01",
      results: [],
      fetchedAt: Date.now(),
    });
    const req = makeRequest(validBody);
    const res = await POST(req, { params: Promise.resolve({ id: tripId }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.results).toEqual([]);
  });

  it("uppercases IATA codes", async () => {
    const req = makeRequest({ ...validBody, fromIata: "cdg", toIata: "nrt" });
    await POST(req, { params: Promise.resolve({ id: tripId }) });

    expect(mockSearch).toHaveBeenCalledWith(
      expect.objectContaining({ fromIata: "CDG", toIata: "NRT" })
    );
  });

  it("passes nonStop and maxPrice filters", async () => {
    const req = makeRequest({ ...validBody, nonStop: true, maxPrice: 500 });
    await POST(req, { params: Promise.resolve({ id: tripId }) });

    expect(mockSearch).toHaveBeenCalledWith(
      expect.objectContaining({ nonStop: true, maxPrice: 500 })
    );
  });

  it("passes undefined filters when none provided", async () => {
    const req = makeRequest(validBody);
    await POST(req, { params: Promise.resolve({ id: tripId }) });

    expect(mockSearch).toHaveBeenCalledWith(
      expect.objectContaining({ nonStop: undefined, maxPrice: undefined })
    );
  });
});
