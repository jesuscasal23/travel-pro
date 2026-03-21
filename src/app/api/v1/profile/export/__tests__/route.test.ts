// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/core/prisma", () => ({
  prisma: {
    profile: { findUnique: vi.fn() },
  },
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
import { GET } from "../route";

const mockPrisma = prisma as unknown as {
  profile: { findUnique: ReturnType<typeof vi.fn> };
};
const mockAuth = getAuthenticatedUserId as ReturnType<typeof vi.fn>;

describe("GET /api/v1/profile/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue("user-1");
    mockPrisma.profile.findUnique.mockResolvedValue({
      id: "profile-1",
      userId: "user-1",
      activityLevel: "high",
      trips: [],
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/v1/profile/export");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns exported profile payload", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/profile/export");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.profile.id).toBe("profile-1");
    expect(json.profile.pace).toBe("active");
    expect(json.profile.activityLevel).toBeUndefined();
    expect(json.exportedAt).toBeTypeOf("string");
  });
});
