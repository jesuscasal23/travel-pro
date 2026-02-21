// ============================================================
// API Route Handler — Integration Tests
// Imports the actual Next.js route handlers and calls them
// with real requests against the real database.
// Only mocks: Supabase auth + logger
// ============================================================
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock Supabase auth — the only external dependency we can't provide
vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUserId: vi.fn().mockResolvedValue(null),
  createClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { getAuthenticatedUserId } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { createTestTrip, createTestProfile, createTestItinerary } from "./helpers";

// Import actual route handlers
import { POST } from "@/app/api/v1/trips/route";
import { GET as GET_TRIP } from "@/app/api/v1/trips/[id]/route";

beforeEach(() => {
  vi.mocked(getAuthenticatedUserId).mockResolvedValue(null);
});

describe("POST /api/v1/trips", () => {
  it("creates an anonymous trip and persists it", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/trips", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        tripType: "multi-city",
        region: "southeast-asia",
        dateStart: "2026-04-01",
        dateEnd: "2026-04-22",
        travelers: 2,
      }),
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.trip.id).toBeDefined();
    expect(body.trip.profileId).toBeNull();
    expect(body.trip.region).toBe("southeast-asia");

    // Verify it actually persisted to the database
    const dbTrip = await prisma.trip.findUnique({
      where: { id: body.trip.id },
    });
    expect(dbTrip).not.toBeNull();
  });

  it("creates a trip linked to an authenticated user's profile", async () => {
    const profile = await createTestProfile(prisma, "user-api-test-1");
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-api-test-1");

    const req = new NextRequest("http://localhost:3000/api/v1/trips", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        region: "western-europe",
        dateStart: "2026-06-01",
        dateEnd: "2026-06-15",
      }),
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.trip.profileId).toBe(profile.id);
  });

  it("returns 400 for invalid body (missing required fields)", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/trips", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ travelers: -1 }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("returns 400 for non-JSON body", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/trips", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json",
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});

describe("GET /api/v1/trips/[id]", () => {
  it("returns a trip with its active itinerary", async () => {
    const trip = await createTestTrip(prisma);
    await createTestItinerary(prisma, trip.id);

    const req = new NextRequest(
      `http://localhost:3000/api/v1/trips/${trip.id}`,
    );

    const response = await GET_TRIP(req, {
      params: Promise.resolve({ id: trip.id }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.trip.id).toBe(trip.id);
    expect(body.trip.itineraries).toBeDefined();
  });

  it("returns 404 for non-existent trip", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/v1/trips/nonexistent-id",
    );

    const response = await GET_TRIP(req, {
      params: Promise.resolve({ id: "nonexistent-id" }),
    });

    expect(response.status).toBe(404);
  });
});
