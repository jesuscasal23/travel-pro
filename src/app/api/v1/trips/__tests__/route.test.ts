// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/core/prisma", () => ({
  prisma: {
    profile: { findUnique: vi.fn() },
    trip: { findMany: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("@/lib/core/supabase-server", () => ({
  getAuthenticatedUserId: vi.fn(),
}));

vi.mock("@/lib/api/guest-trip-ownership", () => ({
  createGuestTripOwnerCookie: vi.fn().mockReturnValue({
    name: "travelpro_guest_trip_trip-new",
    value: "v1.sig",
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 7776000,
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

import { prisma } from "@/lib/core/prisma";
import { getAuthenticatedUserId } from "@/lib/core/supabase-server";
import { GET, POST } from "../route";

const mockPrisma = prisma as unknown as {
  profile: { findUnique: ReturnType<typeof vi.fn> };
  trip: { findMany: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
};
const mockAuth = getAuthenticatedUserId as ReturnType<typeof vi.fn>;

describe("/api/v1/trips", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue("user-1");
    mockPrisma.profile.findUnique.mockResolvedValue({ id: "profile-1", userId: "user-1" });
    mockPrisma.trip.findMany.mockResolvedValue([{ id: "trip-1", itineraries: [] }]);
    mockPrisma.trip.create.mockResolvedValue({
      id: "trip-new",
      itineraries: [],
      discoveredActivities: [],
    });
  });

  it("GET returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/v1/trips");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("GET returns user trips", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/trips");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.trips).toHaveLength(1);
  });

  it("GET returns an empty list when the user has no profile yet", async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/v1/trips");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ trips: [] });
    expect(mockPrisma.trip.findMany).not.toHaveBeenCalled();
  });

  it("POST validates body", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/trips", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tripType: "multi-city" }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Validation failed");
  });

  it("POST creates guest trip when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/v1/trips", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        tripType: "multi-city",
        region: "europe",
        dateStart: "2026-06-01",
        dateEnd: "2026-06-10",
        travelers: 2,
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.trip.id).toBe("trip-new");
    expect(mockPrisma.trip.create).toHaveBeenCalled();
    // profile is not linked for guest trips
    expect(mockPrisma.profile.findUnique).not.toHaveBeenCalled();
  });

  it("POST sets guest cookie when authenticated user has no profile", async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/v1/trips", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        tripType: "multi-city",
        region: "europe",
        dateStart: "2026-06-01",
        dateEnd: "2026-06-10",
        travelers: 2,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    // Trip created with null profileId → guest cookie must be set
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("travelpro_guest_trip_trip-new");
  });

  it("POST creates trip", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/trips", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        tripType: "multi-city",
        region: "europe",
        dateStart: "2026-06-01",
        dateEnd: "2026-06-10",
        travelers: 2,
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.trip.id).toBe("trip-new");
    expect(mockPrisma.trip.create).toHaveBeenCalled();
  });
});
