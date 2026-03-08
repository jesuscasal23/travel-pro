// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    profile: { findUnique: vi.fn() },
    trip: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUserId: vi.fn(),
}));

vi.mock("@/lib/features/trips/trip-share-service", () => ({
  getOrCreateTripShareToken: vi.fn(),
  serializeTripShareToken: vi.fn((shareToken: string) => ({
    shareToken,
    shareUrl: `https://travelpro.app/share/${shareToken}`,
  })),
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
import { getOrCreateTripShareToken } from "@/lib/features/trips/trip-share-service";
import { GET } from "../route";

const mockPrisma = prisma as unknown as {
  profile: { findUnique: ReturnType<typeof vi.fn> };
  trip: { findUnique: ReturnType<typeof vi.fn> };
};
const mockAuth = getAuthenticatedUserId as ReturnType<typeof vi.fn>;
const mockGetOrCreateTripShareToken = getOrCreateTripShareToken as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue("user-1");
  mockPrisma.profile.findUnique.mockResolvedValue({ id: "profile-1", userId: "user-1" });
  mockPrisma.trip.findUnique.mockResolvedValue({ id: "trip-1", profileId: "profile-1" });
  mockGetOrCreateTripShareToken.mockResolvedValue("abc123token");
});

describe("GET /api/v1/trips/:id/share", () => {
  it("returns share token + share URL for the owner", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/trips/trip-1/share");
    const res = await GET(req, { params: Promise.resolve({ id: "trip-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockGetOrCreateTripShareToken).toHaveBeenCalledWith("trip-1");
    expect(json.shareToken).toBe("abc123token");
    expect(json.shareUrl).toContain("/share/abc123token");
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/v1/trips/trip-1/share");
    const res = await GET(req, { params: Promise.resolve({ id: "trip-1" }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 when user does not own the trip", async () => {
    mockPrisma.trip.findUnique.mockResolvedValue({ id: "trip-1", profileId: "other-profile" });
    const req = new NextRequest("http://localhost:3000/api/v1/trips/trip-1/share");
    const res = await GET(req, { params: Promise.resolve({ id: "trip-1" }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toBe("Forbidden");
    expect(mockGetOrCreateTripShareToken).not.toHaveBeenCalled();
  });
});
