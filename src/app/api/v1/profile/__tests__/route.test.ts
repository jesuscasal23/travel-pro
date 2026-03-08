// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    trip: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    affiliateClick: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUserId: vi.fn(),
}));

const mockDeleteUser = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      admin: {
        deleteUser: mockDeleteUser,
      },
    },
  })),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
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
import { GET, PATCH, DELETE } from "../route";

const mockPrisma = prisma as unknown as {
  profile: {
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  trip: {
    findMany: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  affiliateClick: {
    deleteMany: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};
const mockAuth = getAuthenticatedUserId as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  mockAuth.mockResolvedValue("user-1");
  mockPrisma.profile.upsert.mockResolvedValue({
    id: "profile-1",
    userId: "user-1",
    nationality: "German",
    homeAirport: "FRA",
    travelStyle: "comfort",
    interests: ["culture"],
    activityLevel: "moderate",
    onboardingCompleted: true,
  });
  mockPrisma.profile.findUnique.mockResolvedValue({
    id: "profile-1",
    userId: "user-1",
    nationality: "German",
    homeAirport: "FRA",
    travelStyle: "comfort",
    interests: ["culture"],
    activityLevel: "low",
    onboardingCompleted: true,
  });
  mockPrisma.profile.deleteMany.mockResolvedValue({ count: 1 });
  mockPrisma.trip.findMany.mockResolvedValue([{ id: "trip-1" }, { id: "trip-2" }]);
  mockPrisma.trip.deleteMany.mockResolvedValue({ count: 2 });
  mockPrisma.affiliateClick.deleteMany.mockResolvedValue({ count: 3 });
  mockPrisma.$transaction.mockImplementation(async (callback) =>
    callback({
      profile: {
        findUnique: mockPrisma.profile.findUnique,
        deleteMany: mockPrisma.profile.deleteMany,
      },
      trip: {
        findMany: mockPrisma.trip.findMany,
        deleteMany: mockPrisma.trip.deleteMany,
      },
      affiliateClick: {
        deleteMany: mockPrisma.affiliateClick.deleteMany,
      },
    })
  );
  mockDeleteUser.mockResolvedValue({});
});

describe("GET /api/v1/profile", () => {
  it("returns the profile with canonical pace semantics", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/profile");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.profile.pace).toBe("relaxed");
    expect(json.profile.activityLevel).toBeUndefined();
  });
});

describe("PATCH /api/v1/profile", () => {
  it("upserts profile preferences for authenticated user", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nationality: "German",
        homeAirport: "FRA",
        travelStyle: "comfort",
        interests: ["culture"],
        onboardingCompleted: true,
      }),
    });

    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockPrisma.profile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
      })
    );
    expect(json.profile.userId).toBe("user-1");
    expect(json.profile.pace).toBe("moderate");
    expect(json.profile.activityLevel).toBeUndefined();
  });

  it("maps legacy activityLevel input onto canonical pace storage", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nationality: "German",
        activityLevel: "high",
      }),
    });

    const res = await PATCH(req);

    expect(res.status).toBe(200);
    expect(mockPrisma.profile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ activityLevel: "active" }),
        update: expect.objectContaining({ activityLevel: "active" }),
      })
    );
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/v1/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nationality: "German" }),
    });

    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });
});

describe("DELETE /api/v1/profile", () => {
  it("deletes local profile data and Supabase auth user", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/profile", {
      method: "DELETE",
    });

    const res = await DELETE(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockPrisma.profile.findUnique).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: { id: true },
    });
    expect(mockPrisma.trip.findMany).toHaveBeenCalledWith({
      where: { profileId: "profile-1" },
      select: { id: true },
    });
    expect(mockPrisma.affiliateClick.deleteMany).toHaveBeenCalledWith({
      where: { tripId: { in: ["trip-1", "trip-2"] } },
    });
    expect(mockPrisma.trip.deleteMany).toHaveBeenCalledWith({
      where: { profileId: "profile-1" },
    });
    expect(mockPrisma.profile.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
    expect(mockDeleteUser).toHaveBeenCalledWith("user-1");
    expect(json).toEqual({ deleted: true });
  });
});
