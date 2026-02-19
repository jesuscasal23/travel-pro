// @vitest-environment node
// ============================================================
// Integration tests for POST /api/generate
//
// Strategy:
//   - Import the route handler directly (no HTTP server)
//   - Mock the entire pipeline module to isolate the route logic
//   - Construct NextRequest objects to simulate real requests
//   - Assert HTTP status codes and response body shape
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the pipeline before any module under test is imported
vi.mock("@/lib/ai/pipeline", () => ({
  generateItinerary: vi.fn(),
}));

import { POST } from "@/app/api/generate/route";
import { generateItinerary } from "@/lib/ai/pipeline";

const mockGenerateItinerary = vi.mocked(generateItinerary);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const validProfile = {
  nationality: "German",
  homeAirport: "FRA – Frankfurt",
  travelStyle: "comfort",
  interests: ["culture", "food"],
};

const validTripIntent = {
  id: "test-trip-001",
  tripType: "multi-city" as const,
  region: "southeast-asia",
  dateStart: "2026-04-01",
  dateEnd: "2026-04-22",
  flexibleDates: false,
  budget: 10000,
  travelers: 2,
};

const mockItinerary = {
  route: [
    { id: "tokyo", city: "Tokyo", country: "Japan", lat: 35.68, lng: 139.69, days: 5, countryCode: "JP" },
  ],
  days: [
    {
      day: 1,
      date: "Oct 1",
      city: "Tokyo",
      activities: [
        { name: "Senso-ji Temple", category: "culture", icon: "⛩️", why: "Oldest temple.", duration: "2h" },
      ],
    },
  ],
  budget: {
    flights: 1200,
    accommodation: 2800,
    activities: 1500,
    food: 1400,
    transport: 500,
    total: 7400,
    budget: 10000,
  },
  visaData: [],
  weatherData: [],
};

// ── Helper ────────────────────────────────────────────────────────────────────

function makeRequest(body: unknown, contentType = "application/json") {
  return new NextRequest("http://localhost/api/generate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": contentType },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/generate", () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test-key-for-integration-tests";
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  // ── Happy path ───────────────────────────────────────────────────────────

  describe("happy path", () => {
    it("returns HTTP 200 on a valid request", async () => {
      mockGenerateItinerary.mockResolvedValue(mockItinerary);

      const res = await POST(makeRequest({ profile: validProfile, tripIntent: validTripIntent }));

      expect(res.status).toBe(200);
    });

    it("returns { success: true, itinerary } in the response body", async () => {
      mockGenerateItinerary.mockResolvedValue(mockItinerary);

      const res = await POST(makeRequest({ profile: validProfile, tripIntent: validTripIntent }));
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(body.itinerary).toBeDefined();
    });

    it("response itinerary has the shape returned by generateItinerary", async () => {
      mockGenerateItinerary.mockResolvedValue(mockItinerary);

      const res = await POST(makeRequest({ profile: validProfile, tripIntent: validTripIntent }));
      const body = await res.json();

      expect(body.itinerary.route[0].city).toBe("Tokyo");
      expect(body.itinerary.days[0].day).toBe(1);
      expect(body.itinerary.budget.total).toBe(7400);
    });

    it("calls generateItinerary exactly once with the correct profile and tripIntent", async () => {
      mockGenerateItinerary.mockResolvedValue(mockItinerary);

      await POST(makeRequest({ profile: validProfile, tripIntent: validTripIntent }));

      expect(mockGenerateItinerary).toHaveBeenCalledOnce();
      expect(mockGenerateItinerary).toHaveBeenCalledWith(validProfile, validTripIntent, undefined);
    });

    it("passes pre-selected cities to generateItinerary when provided", async () => {
      mockGenerateItinerary.mockResolvedValue(mockItinerary);

      const cities = [
        { id: "tokyo", city: "Tokyo", country: "Japan", countryCode: "JP", iataCode: "NRT", lat: 35.68, lng: 139.69, minDays: 3, maxDays: 5 },
      ];

      await POST(makeRequest({ profile: validProfile, tripIntent: validTripIntent, cities }));

      expect(mockGenerateItinerary).toHaveBeenCalledOnce();
      expect(mockGenerateItinerary).toHaveBeenCalledWith(validProfile, validTripIntent, cities);
    });

    it("does not call generateItinerary when the API key is missing", async () => {
      delete process.env.ANTHROPIC_API_KEY;

      await POST(makeRequest({ profile: validProfile, tripIntent: validTripIntent }));

      expect(mockGenerateItinerary).not.toHaveBeenCalled();
    });
  });

  // ── Missing API key ──────────────────────────────────────────────────────

  describe("missing ANTHROPIC_API_KEY", () => {
    it("returns HTTP 500 when the env var is absent", async () => {
      delete process.env.ANTHROPIC_API_KEY;

      const res = await POST(makeRequest({ profile: validProfile, tripIntent: validTripIntent }));

      expect(res.status).toBe(500);
    });

    it("returns an error message when the API key is absent", async () => {
      delete process.env.ANTHROPIC_API_KEY;

      const res = await POST(makeRequest({ profile: validProfile, tripIntent: validTripIntent }));
      const body = await res.json();

      expect(body.error).toBeDefined();
      expect(typeof body.error).toBe("string");
    });
  });

  // ── Invalid request body ─────────────────────────────────────────────────

  describe("invalid request body", () => {
    it("returns HTTP 400 when profile is missing from the body", async () => {
      const res = await POST(makeRequest({ tripIntent: validTripIntent }));

      expect(res.status).toBe(400);
    });

    it("returns HTTP 400 when tripIntent is missing from the body", async () => {
      const res = await POST(makeRequest({ profile: validProfile }));

      expect(res.status).toBe(400);
    });

    it("returns HTTP 400 when both profile and tripIntent are missing", async () => {
      const res = await POST(makeRequest({}));

      expect(res.status).toBe(400);
    });

    it("returns HTTP 400 when the request body is not valid JSON", async () => {
      const req = new NextRequest("http://localhost/api/generate", {
        method: "POST",
        body: "this is not json {{",
        headers: { "Content-Type": "application/json" },
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it("response body contains an error string for missing fields", async () => {
      const res = await POST(makeRequest({ tripIntent: validTripIntent }));
      const body = await res.json();

      expect(typeof body.error).toBe("string");
      expect(body.error.length).toBeGreaterThan(0);
    });
  });

  // ── Pipeline failure ─────────────────────────────────────────────────────

  describe("pipeline failure", () => {
    it("returns HTTP 500 when generateItinerary throws an Error", async () => {
      mockGenerateItinerary.mockRejectedValue(new Error("Claude API timeout"));

      const res = await POST(makeRequest({ profile: validProfile, tripIntent: validTripIntent }));

      expect(res.status).toBe(500);
    });

    it("returns a generic error message to the client", async () => {
      mockGenerateItinerary.mockRejectedValue(new Error("Claude API timeout"));

      const res = await POST(makeRequest({ profile: validProfile, tripIntent: validTripIntent }));
      const body = await res.json();

      expect(body.error).toBeDefined();
      expect(typeof body.error).toBe("string");
    });

    it("returns HTTP 500 and an error string when a non-Error value is thrown", async () => {
      mockGenerateItinerary.mockRejectedValue("unexpected string rejection");

      const res = await POST(makeRequest({ profile: validProfile, tripIntent: validTripIntent }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(typeof body.error).toBe("string");
    });

    it("returns HTTP 500 when generateItinerary rejects with a Zod-style validation error", async () => {
      mockGenerateItinerary.mockRejectedValue(
        new Error("Itinerary schema validation failed: route.0.lat: Expected number, received string")
      );

      const res = await POST(makeRequest({ profile: validProfile, tripIntent: validTripIntent }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(typeof body.error).toBe("string");
    });

    it("does not expose success:true on a pipeline failure", async () => {
      mockGenerateItinerary.mockRejectedValue(new Error("Failure"));

      const res = await POST(makeRequest({ profile: validProfile, tripIntent: validTripIntent }));
      const body = await res.json();

      expect(body.success).toBeUndefined();
    });
  });
});
