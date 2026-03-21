// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/core/prisma", () => ({
  prisma: {
    itinerary: { findFirst: vi.fn() },
    affiliateClick: { create: vi.fn() },
  },
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

vi.mock("@/lib/core/supabase-server", () => ({
  getAuthenticatedUserId: vi.fn().mockResolvedValue(null),
}));

import { prisma } from "@/lib/core/prisma";
import { GET } from "../route";

const mockPrisma = prisma as unknown as {
  itinerary: { findFirst: ReturnType<typeof vi.fn> };
  affiliateClick: { create: ReturnType<typeof vi.fn> };
};

describe("GET /api/v1/affiliate/redirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.itinerary.findFirst.mockResolvedValue({ tripId: "trip-1" });
    mockPrisma.affiliateClick.create.mockResolvedValue({ id: "click-1" });
  });

  it("returns 400 on invalid query", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/affiliate/redirect?provider=booking");

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Validation failed");
  });

  it("logs click and redirects for allowed domains", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/v1/affiliate/redirect?provider=booking&type=hotel&dest=https%3A%2F%2Fbooking.com%2Fhotel%2Ffoo&itinerary_id=it-1&city=Lisbon",
      {
        headers: { "x-forwarded-for": "127.0.0.1" },
      }
    );

    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://booking.com/hotel/foo");
    expect(mockPrisma.affiliateClick.create).toHaveBeenCalledTimes(1);
  });
});
