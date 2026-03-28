// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  enrichAccommodation: vi.fn(),
  getAuthenticatedUserId: vi.fn(),
}));

vi.mock("@/lib/ai/enrichment", () => ({
  enrichAccommodation: mocks.enrichAccommodation,
}));

vi.mock("@/lib/core/supabase-server", () => ({
  getAuthenticatedUserId: mocks.getAuthenticatedUserId,
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

import { POST } from "../route";

describe("POST /api/v1/enrich/accommodation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthenticatedUserId.mockResolvedValue("user-123");
    mocks.enrichAccommodation.mockResolvedValue([{ city: "Lisbon", hotels: [] }]);
  });

  it("returns 401 when unauthenticated", async () => {
    mocks.getAuthenticatedUserId.mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/v1/enrich/accommodation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        route: [
          {
            id: "lisbon",
            city: "Lisbon",
            country: "Portugal",
            countryCode: "PT",
            lat: 1,
            lng: 2,
            days: 2,
          },
        ],
        dateStart: "2026-06-01",
        travelers: 2,
        travelStyle: "smart-budget",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid body", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/enrich/accommodation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        route: [],
        dateStart: "2026-06-01",
        travelers: 2,
        travelStyle: "smart-budget",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Validation failed");
  });

  it("returns accommodationData for valid payload", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/enrich/accommodation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        route: [
          {
            id: "lisbon",
            city: "Lisbon",
            country: "Portugal",
            countryCode: "PT",
            lat: 1,
            lng: 2,
            days: 2,
          },
        ],
        dateStart: "2026-06-01",
        travelers: 2,
        travelStyle: "smart-budget",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.accommodationData).toHaveLength(1);
  });
});
