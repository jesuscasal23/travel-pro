// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    trip: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { prisma } from "@/lib/db/prisma";
import { GET } from "../route";

const mockPrisma = prisma as unknown as {
  trip: { findFirst: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/v1/trips/shared/:token", () => {
  it("returns only public trip fields and active itinerary", async () => {
    mockPrisma.trip.findFirst.mockResolvedValue({
      id: "trip-1",
      region: "east-asia",
      dateStart: "2026-04-01",
      dateEnd: "2026-04-08",
      travelers: 2,
      profileId: "private-profile-id",
      itineraries: [{ data: { route: [], days: [] } }],
    });

    const req = new NextRequest("http://localhost:3000/api/v1/trips/shared/token-1");
    const res = await GET(req, { params: Promise.resolve({ token: "token-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.trip).toEqual({
      id: "trip-1",
      region: "east-asia",
      dateStart: "2026-04-01",
      dateEnd: "2026-04-08",
      travelers: 2,
    });
    expect(json.itinerary).toEqual({ route: [], days: [] });
    expect(json.trip.profileId).toBeUndefined();
  });

  it("returns 404 when token is missing or has no active itinerary", async () => {
    mockPrisma.trip.findFirst.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/v1/trips/shared/missing");
    const res = await GET(req, { params: Promise.resolve({ token: "missing" }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("Trip not found");
  });

  it("returns 500 when database query throws", async () => {
    mockPrisma.trip.findFirst.mockRejectedValue(new Error("db down"));

    const req = new NextRequest("http://localhost:3000/api/v1/trips/shared/token-1");
    const res = await GET(req, { params: Promise.resolve({ token: "token-1" }) });
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Failed to load trip");
  });
});
