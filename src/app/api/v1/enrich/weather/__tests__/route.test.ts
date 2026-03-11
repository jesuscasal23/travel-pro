// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  enrichWeather: vi.fn(),
}));

vi.mock("@/lib/ai/enrichment", () => ({
  enrichWeather: mocks.enrichWeather,
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

describe("POST /api/v1/enrich/weather", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.enrichWeather.mockResolvedValue([{ city: "Lisbon", temp: "22C" }]);
  });

  it("returns 400 on invalid body", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/enrich/weather", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ route: [] }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Validation failed");
  });

  it("returns weatherData for valid payload", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/enrich/weather", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        route: [{ city: "Lisbon", country: "Portugal", countryCode: "PT", lat: 1, lng: 2 }],
        dateStart: "2026-06-01",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.weatherData).toHaveLength(1);
  });
});
