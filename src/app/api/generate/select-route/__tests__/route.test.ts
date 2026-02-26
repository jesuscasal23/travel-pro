// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {},
}));

vi.mock("@/lib/ai/prompts/route-selector", () => ({
  selectRoute: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { selectRoute } from "@/lib/ai/prompts/route-selector";
import { POST } from "../route";

const mockSelectRoute = selectRoute as ReturnType<typeof vi.fn>;
const originalApiKey = process.env.ANTHROPIC_API_KEY;

const validBody = {
  profile: {
    nationality: "German",
    homeAirport: "FRA",
    travelStyle: "comfort",
    interests: ["culture", "food"],
  },
  tripIntent: {
    id: "trip-1",
    tripType: "multi-city",
    region: "east-asia",
    dateStart: "2026-04-01",
    dateEnd: "2026-04-08",
    travelers: 2,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ANTHROPIC_API_KEY = "test-key";
  mockSelectRoute.mockResolvedValue([
    {
      id: "tokyo",
      city: "Tokyo",
      country: "Japan",
      countryCode: "JP",
      iataCode: "NRT",
      lat: 35.68,
      lng: 139.69,
      minDays: 3,
      maxDays: 5,
    },
  ]);
});

afterEach(() => {
  process.env.ANTHROPIC_API_KEY = originalApiKey;
});

function makeRequest(body: object | string) {
  return new NextRequest("http://localhost:3000/api/generate/select-route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/generate/select-route", () => {
  it("returns 400 for invalid JSON", async () => {
    const req = makeRequest("not-json");
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Invalid request body");
  });

  it("returns 400 for invalid request schema", async () => {
    const req = makeRequest({ profile: {} });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid request data");
    expect(json.details).toBeDefined();
  });

  it("returns 500 when API key is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const req = makeRequest(validBody);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Service is not configured");
  });

  it("short-circuits single-city requests without calling Claude", async () => {
    const req = makeRequest({
      ...validBody,
      tripIntent: {
        ...validBody.tripIntent,
        tripType: "single-city",
        region: "",
        destination: "Tokyo",
        destinationCountry: "Japan",
        destinationCountryCode: "JP",
        destinationLat: 35.68,
        destinationLng: 139.69,
      },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.cities).toHaveLength(1);
    expect(json.cities[0]).toMatchObject({ city: "Tokyo", country: "Japan" });
    expect(mockSelectRoute).not.toHaveBeenCalled();
  });

  it("returns cities from selectRoute on success", async () => {
    const req = makeRequest(validBody);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockSelectRoute).toHaveBeenCalledTimes(1);
    expect(json.cities[0].city).toBe("Tokyo");
  });

  it("returns 200 with null cities when selectRoute throws", async () => {
    mockSelectRoute.mockRejectedValue(new Error("Claude timeout"));
    const req = makeRequest(validBody);

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ cities: null });
  });
});
