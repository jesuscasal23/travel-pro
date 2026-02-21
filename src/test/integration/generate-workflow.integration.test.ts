// ============================================================
// Generate Workflow — Integration Tests
// Tests the full SSE generation endpoint against a real database
// with mocked Claude API responses. Verifies the complete chain:
//   HTTP request → Zod validation → Prisma writes → SSE events
// ============================================================
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createTestTrip } from "./helpers";

// ── Mocks ────────────────────────────────────────────────────

// Mock Supabase auth (not needed for generation, but imported transitively)
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

// ── Mock Claude response data ────────────────────────────────
// This must pass the Zod schema in pipeline.ts (claudeItinerarySchema)

const MOCK_SINGLE_CITY_ITINERARY = {
  route: [
    {
      id: "tokyo",
      city: "Tokyo",
      country: "Japan",
      lat: 35.68,
      lng: 139.69,
      days: 5,
      countryCode: "JP",
      iataCode: "NRT",
    },
  ],
  days: [
    {
      day: 1,
      date: "2026-04-01",
      city: "Tokyo",
      activities: [
        {
          name: "Senso-ji Temple",
          category: "culture",
          icon: "🏯",
          why: "Tokyo's oldest and most famous temple",
          duration: "2 hours",
          tip: "Visit early morning to avoid crowds",
        },
      ],
    },
    {
      day: 2,
      date: "2026-04-02",
      city: "Tokyo",
      activities: [
        {
          name: "Tsukiji Outer Market",
          category: "food",
          icon: "🍣",
          why: "Fresh sushi and street food paradise",
          duration: "3 hours",
        },
      ],
    },
  ],
  budget: {
    flights: 800,
    accommodation: 1500,
    activities: 400,
    food: 600,
    transport: 200,
    total: 3500,
    budget: 5000,
  },
};

const MOCK_MULTI_CITY_ITINERARY = {
  route: [
    {
      id: "tokyo",
      city: "Tokyo",
      country: "Japan",
      lat: 35.68,
      lng: 139.69,
      days: 4,
      countryCode: "JP",
      iataCode: "NRT",
    },
    {
      id: "hanoi",
      city: "Hanoi",
      country: "Vietnam",
      lat: 21.03,
      lng: 105.85,
      days: 3,
      countryCode: "VN",
      iataCode: "HAN",
    },
  ],
  days: [
    {
      day: 1,
      date: "2026-04-01",
      city: "Tokyo",
      activities: [
        {
          name: "Meiji Shrine",
          category: "culture",
          icon: "⛩️",
          why: "Peaceful forest shrine in the heart of the city",
          duration: "2 hours",
        },
      ],
    },
    {
      day: 5,
      date: "2026-04-05",
      city: "Hanoi",
      isTravel: true,
      travelFrom: "Tokyo",
      travelTo: "Hanoi",
      activities: [
        {
          name: "Old Quarter walking tour",
          category: "culture",
          icon: "🚶",
          why: "Explore the 36 ancient streets",
          duration: "3 hours",
        },
      ],
    },
  ],
  budget: {
    flights: 1200,
    accommodation: 2000,
    activities: 800,
    food: 1000,
    transport: 500,
    total: 5500,
    budget: 10000,
  },
};

// Mock the Anthropic SDK — intercepts all Claude API calls
vi.mock("@anthropic-ai/sdk", () => {
  // Track how many times create is called to alternate responses if needed
  let callCount = 0;

  return {
    default: class MockAnthropic {
      messages = {
        create: vi.fn().mockImplementation(async () => {
          callCount++;
          // Use multi-city for the second call (if route selection happened first)
          // or use whatever is appropriate based on the prompt
          const itinerary =
            callCount === 1
              ? MOCK_SINGLE_CITY_ITINERARY
              : MOCK_MULTI_CITY_ITINERARY;
          return {
            content: [{ type: "text", text: JSON.stringify(itinerary) }],
            stop_reason: "end_turn",
            usage: { input_tokens: 500, output_tokens: 2000 },
            model: "claude-haiku-4-5-20251001",
          };
        }),
      };

      constructor() {
        // Reset call count for each new client instance
        callCount = 0;
      }
    },
  };
});

// Import route handler AFTER mocks are set up
import { POST as GENERATE } from "@/app/api/v1/trips/[id]/generate/route";

// ── Helpers ──────────────────────────────────────────────────

/** Read an SSE stream and parse all events. */
async function readSSEEvents(
  response: Response,
): Promise<Array<Record<string, unknown>>> {
  const text = await response.text();
  const events: Array<Record<string, unknown>> = [];

  for (const line of text.split("\n")) {
    if (line.startsWith("data: ")) {
      events.push(JSON.parse(line.slice(6)));
    }
  }

  return events;
}

// ── Tests ────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/v1/trips/[id]/generate — single-city", () => {
  it("generates a single-city itinerary end-to-end", async () => {
    // 1. Create a single-city trip in the real database
    const trip = await createTestTrip(prisma, {
      tripType: "single-city",
      region: "",
      destination: "Tokyo",
      destinationCountry: "Japan",
      destinationCountryCode: "JP",
      dateStart: "2026-04-01",
      dateEnd: "2026-04-05",
      budget: 5000,
      travelers: 1,
    });

    // 2. Call the generate endpoint
    const req = new NextRequest(
      `http://localhost:3000/api/v1/trips/${trip.id}/generate`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          profile: {
            nationality: "German",
            homeAirport: "FRA",
            travelStyle: "comfort",
            interests: ["culture", "food"],
          },
          promptVersion: "v1",
        }),
      },
    );

    const response = await GENERATE(req, {
      params: Promise.resolve({ id: trip.id }),
    });

    // 3. Verify SSE response format
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");

    // 4. Parse all SSE events
    const events = await readSSEEvents(response);

    // 5. Verify event sequence: activities → done (single-city skips "route" stage)
    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events[0]).toMatchObject({
      stage: "activities",
      pct: 20,
    });

    const doneEvent = events.find((e) => e.stage === "done");
    expect(doneEvent).toBeDefined();
    expect(doneEvent).toMatchObject({
      stage: "done",
      pct: 100,
      trip_id: trip.id,
    });
    expect(doneEvent!.itinerary_id).toBeDefined();

    // 6. Verify database state — itinerary was created and activated
    const itinerary = await prisma.itinerary.findFirst({
      where: { tripId: trip.id, isActive: true },
    });
    expect(itinerary).not.toBeNull();
    expect(itinerary!.generationStatus).toBe("complete");
    expect(itinerary!.promptVersion).toBe("v1");

    // 7. Verify the stored data matches what Claude returned
    const data = itinerary!.data as unknown as Record<string, unknown>;
    expect(data).toHaveProperty("route");
    expect(data).toHaveProperty("days");
    expect(data).toHaveProperty("budget");
  });
});

describe("POST /api/v1/trips/[id]/generate — multi-city with pre-selected cities", () => {
  it("generates a multi-city itinerary with pre-selected cities", async () => {
    // 1. Create a multi-city trip
    const trip = await createTestTrip(prisma, {
      tripType: "multi-city",
      region: "east-asia",
      dateStart: "2026-04-01",
      dateEnd: "2026-04-10",
      budget: 10000,
      travelers: 2,
    });

    // 2. Call with pre-selected cities (skips route selection API call)
    const req = new NextRequest(
      `http://localhost:3000/api/v1/trips/${trip.id}/generate`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          profile: {
            nationality: "German",
            homeAirport: "FRA",
            travelStyle: "comfort",
            interests: ["culture", "food"],
          },
          promptVersion: "v1",
          cities: [
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
            {
              id: "hanoi",
              city: "Hanoi",
              country: "Vietnam",
              countryCode: "VN",
              iataCode: "HAN",
              lat: 21.03,
              lng: 105.85,
              minDays: 2,
              maxDays: 4,
            },
          ],
        }),
      },
    );

    const response = await GENERATE(req, {
      params: Promise.resolve({ id: trip.id }),
    });

    // 3. Parse SSE events
    const events = await readSSEEvents(response);

    // 4. Verify event sequence: route → activities → done (multi-city)
    expect(events.length).toBeGreaterThanOrEqual(3);
    expect(events[0]).toMatchObject({ stage: "route", pct: 15 });
    expect(events[1]).toMatchObject({ stage: "activities", pct: 35 });

    const doneEvent = events.find((e) => e.stage === "done");
    expect(doneEvent).toBeDefined();
    expect(doneEvent).toMatchObject({
      stage: "done",
      pct: 100,
      trip_id: trip.id,
    });

    // 5. Verify database — active itinerary exists with the generated data
    const itinerary = await prisma.itinerary.findFirst({
      where: { tripId: trip.id, isActive: true },
    });
    expect(itinerary).not.toBeNull();
    expect(itinerary!.generationStatus).toBe("complete");
  });

  it("deactivates previous itinerary when generating a new one", async () => {
    const trip = await createTestTrip(prisma);

    // Create an existing active itinerary
    const existingItinerary = await prisma.itinerary.create({
      data: {
        tripId: trip.id,
        data: { route: [], days: [], budget: {} },
        version: 1,
        isActive: true,
        promptVersion: "v1",
        generationStatus: "complete",
      },
    });

    // Generate a new one
    const req = new NextRequest(
      `http://localhost:3000/api/v1/trips/${trip.id}/generate`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          profile: {
            nationality: "German",
            homeAirport: "FRA",
            travelStyle: "comfort",
            interests: ["culture"],
          },
          cities: [
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
            {
              id: "hanoi",
              city: "Hanoi",
              country: "Vietnam",
              countryCode: "VN",
              iataCode: "HAN",
              lat: 21.03,
              lng: 105.85,
              minDays: 2,
              maxDays: 4,
            },
          ],
        }),
      },
    );

    const response = await GENERATE(req, {
      params: Promise.resolve({ id: trip.id }),
    });
    await readSSEEvents(response); // consume stream

    // Previous itinerary should be deactivated
    const old = await prisma.itinerary.findUnique({
      where: { id: existingItinerary.id },
    });
    expect(old!.isActive).toBe(false);

    // New itinerary should be active
    const active = await prisma.itinerary.findFirst({
      where: { tripId: trip.id, isActive: true },
    });
    expect(active).not.toBeNull();
    expect(active!.id).not.toBe(existingItinerary.id);
    expect(active!.generationStatus).toBe("complete");
  });
});

describe("POST /api/v1/trips/[id]/generate — error handling", () => {
  it("returns 404 for non-existent trip", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/v1/trips/nonexistent/generate",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          profile: {
            nationality: "German",
            homeAirport: "FRA",
            travelStyle: "comfort",
            interests: ["culture"],
          },
        }),
      },
    );

    const response = await GENERATE(req, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    expect(response.status).toBe(404);
  });

  it("returns 400 for invalid profile", async () => {
    const trip = await createTestTrip(prisma);

    const req = new NextRequest(
      `http://localhost:3000/api/v1/trips/${trip.id}/generate`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          profile: { nationality: "" }, // missing required fields
        }),
      },
    );

    const response = await GENERATE(req, {
      params: Promise.resolve({ id: trip.id }),
    });
    expect(response.status).toBe(400);
  });
});
