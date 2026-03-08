// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  enrichVisa: vi.fn(),
}));

vi.mock("@/lib/ai/enrichment", () => ({
  enrichVisa: mocks.enrichVisa,
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

import { POST } from "../route";

describe("POST /api/v1/enrich/visa", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.enrichVisa.mockResolvedValue([{ country: "Portugal", requirement: "visa-free" }]);
  });

  it("returns 400 on invalid body", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/enrich/visa", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nationality: "", route: [] }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Validation failed");
  });

  it("returns visaData for valid payload", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/enrich/visa", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        nationality: "German",
        route: [{ city: "Lisbon", country: "Portugal", countryCode: "PT", lat: 1, lng: 2 }],
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.visaData).toHaveLength(1);
  });
});
