// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@upstash/redis", () => ({
  Redis: class MockRedis {
    get = vi.fn().mockResolvedValue(null);
    setex = vi.fn().mockResolvedValue("OK");
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

vi.mock("@/lib/affiliate/link-generator", () => ({
  buildFlightLink: vi.fn(
    (leg: { fromIata: string; toIata: string; departureDate: string }, travelers: number) =>
      `https://skyscanner.net/flights/${leg.fromIata}/${leg.toIata}?adults=${travelers}`
  ),
}));

// ── Helpers ──────────────────────────────────────────────────

function makeAmadeusOffer(overrides: {
  price?: string;
  duration?: string;
  airline?: string;
  segments?: number;
  cabin?: string;
  departureAt?: string;
  arrivalAt?: string;
}) {
  const segCount = overrides.segments ?? 1;
  const segments = Array.from({ length: segCount }, (_, i) => ({
    departure: {
      iataCode: i === 0 ? "CDG" : `MID${i}`,
      at: overrides.departureAt ?? "2026-06-01T08:30:00",
    },
    arrival: {
      iataCode: i === segCount - 1 ? "NRT" : `MID${i + 1}`,
      at: overrides.arrivalAt ?? "2026-06-01T20:00:00",
    },
  }));

  return {
    price: { total: overrides.price ?? "450.00", base: "400.00" },
    itineraries: [{ duration: overrides.duration ?? "PT12H30M", segments }],
    validatingAirlineCodes: [overrides.airline ?? "LH"],
    travelerPricings: [{ fareDetailsBySegment: [{ cabin: overrides.cabin ?? "ECONOMY" }] }],
  };
}

const MOCK_OFFERS = [
  makeAmadeusOffer({ price: "450.00", duration: "PT12H30M", airline: "LH", segments: 1 }),
  makeAmadeusOffer({
    price: "380.00",
    duration: "PT14H15M",
    airline: "AF",
    segments: 2,
    departureAt: "2026-06-01T10:00:00",
    arrivalAt: "2026-06-02T00:15:00",
  }),
  makeAmadeusOffer({ price: "320.00", duration: "PT16H", airline: "TK", segments: 2 }),
];

// Token response helper
function tokenResponse() {
  return new Response(JSON.stringify({ access_token: "tok", expires_in: 600 }), { status: 200 });
}

function flightResponse(data: unknown[]) {
  return new Response(JSON.stringify({ data }), { status: 200 });
}

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  // Reset module-level _redis singleton by reimporting
  process.env = {
    ...originalEnv,
    AMADEUS_API_KEY: "test-key",
    AMADEUS_API_SECRET: "test-secret",
    // Don't set Redis env vars — skip caching to simplify tests
  };
});

afterEach(() => {
  process.env = originalEnv;
});

// ── searchFlightsMulti ───────────────────────────────────────

describe("searchFlightsMulti", () => {
  it("returns [] when Amadeus is not configured", async () => {
    delete process.env.AMADEUS_API_KEY;
    const { searchFlightsMulti } = await import("../amadeus");
    const results = await searchFlightsMulti("CDG", "NRT", "2026-06-01", 1);
    expect(results).toEqual([]);
  });

  it("returns up to 5 results sorted by price", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(flightResponse(MOCK_OFFERS));

    const { searchFlightsMulti } = await import("../amadeus");
    const results = await searchFlightsMulti("CDG", "NRT", "2026-06-01", 2);

    expect(results).toHaveLength(3);
    expect(results[0].price).toBe(320);
    expect(results[1].price).toBe(380);
    expect(results[2].price).toBe(450);
  });

  it("computes stops correctly from segments", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(flightResponse(MOCK_OFFERS));

    const { searchFlightsMulti } = await import("../amadeus");
    const results = await searchFlightsMulti("CDG", "NRT", "2026-06-01", 1);

    // TK (cheapest, 2 segments = 1 stop) first
    expect(results[0].stops).toBe(1);
    expect(results[0].airline).toBe("TK");
    // AF (2 segments = 1 stop)
    expect(results[1].stops).toBe(1);
    // LH (1 segment = nonstop)
    expect(results[2].stops).toBe(0);
  });

  it("parses duration correctly", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(
        flightResponse([makeAmadeusOffer({ price: "100.00", duration: "PT12H30M" })])
      );

    const { searchFlightsMulti } = await import("../amadeus");
    const results = await searchFlightsMulti("CDG", "NRT", "2026-06-01", 1);
    expect(results[0].duration).toBe("12h 30m");
  });

  it("extracts cabin class from travelerPricings", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(
        flightResponse([makeAmadeusOffer({ price: "800.00", cabin: "BUSINESS" })])
      );

    const { searchFlightsMulti } = await import("../amadeus");
    const results = await searchFlightsMulti("CDG", "NRT", "2026-06-01", 1);
    expect(results[0].cabin).toBe("BUSINESS");
  });

  it("includes bookingUrl on each result", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(flightResponse([makeAmadeusOffer({ price: "100.00" })]));

    const { searchFlightsMulti } = await import("../amadeus");
    const results = await searchFlightsMulti("CDG", "NRT", "2026-06-01", 2);
    expect(results[0].bookingUrl).toContain("skyscanner");
  });

  it("returns [] on network error", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy
      .mockResolvedValueOnce(tokenResponse())
      .mockRejectedValueOnce(new Error("network down"));

    const { searchFlightsMulti } = await import("../amadeus");
    const results = await searchFlightsMulti("CDG", "NRT", "2026-06-01", 1);
    expect(results).toEqual([]);
  });

  it("returns [] on non-OK response", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response("Error", { status: 500 }));

    const { searchFlightsMulti } = await import("../amadeus");
    const results = await searchFlightsMulti("CDG", "NRT", "2026-06-01", 1);
    expect(results).toEqual([]);
  });

  it("returns [] when API returns no data", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }));

    const { searchFlightsMulti } = await import("../amadeus");
    const results = await searchFlightsMulti("CDG", "NRT", "2026-06-01", 1);
    expect(results).toEqual([]);
  });

  it("returns [] when token fetch fails", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy.mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }));

    const { searchFlightsMulti } = await import("../amadeus");
    const results = await searchFlightsMulti("CDG", "NRT", "2026-06-01", 1);
    expect(results).toEqual([]);
  });
});

// ── prefetchFlightOptions ────────────────────────────────────

describe("prefetchFlightOptions", () => {
  it("returns FlightLegResults for each leg", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(flightResponse([makeAmadeusOffer({ price: "500.00" })]))
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(flightResponse([makeAmadeusOffer({ price: "300.00" })]));

    const { prefetchFlightOptions } = await import("../amadeus");
    const legs = [
      { fromIata: "FRA", toIata: "NRT", departureDate: "2026-06-01" },
      { fromIata: "NRT", toIata: "FRA", departureDate: "2026-06-15" },
    ];

    const results = await prefetchFlightOptions(legs, 2);

    expect(results).toHaveLength(2);
    expect(results[0].fromIata).toBe("FRA");
    expect(results[0].toIata).toBe("NRT");
    expect(results[0].departureDate).toBe("2026-06-01");
    expect(results[0].fetchedAt).toBeGreaterThan(0);
    expect(results[1].fromIata).toBe("NRT");
    expect(results[1].toIata).toBe("FRA");
  });

  it("returns empty results for failed legs without throwing", async () => {
    delete process.env.AMADEUS_API_KEY;

    const { prefetchFlightOptions } = await import("../amadeus");
    const legs = [{ fromIata: "FRA", toIata: "NRT", departureDate: "2026-06-01" }];

    const results = await prefetchFlightOptions(legs, 1);

    expect(results).toHaveLength(1);
    expect(results[0].results).toEqual([]);
    expect(results[0].fromIata).toBe("FRA");
  });

  it("handles mixed success/failure across legs", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    // Both legs run in parallel, each may need its own token call (no Redis cache)
    // We provide enough responses for both legs:
    // token + search succeed, token + search fail
    fetchSpy
      .mockResolvedValueOnce(tokenResponse()) // token for leg 1
      .mockResolvedValueOnce(tokenResponse()) // token for leg 2
      .mockResolvedValueOnce(flightResponse([makeAmadeusOffer({ price: "400.00" })])) // search leg 1
      .mockRejectedValueOnce(new Error("timeout")); // search leg 2

    const { prefetchFlightOptions } = await import("../amadeus");
    const legs = [
      { fromIata: "FRA", toIata: "NRT", departureDate: "2026-06-01" },
      { fromIata: "NRT", toIata: "BKK", departureDate: "2026-06-05" },
    ];

    const results = await prefetchFlightOptions(legs, 1);

    expect(results).toHaveLength(2);
    // At least one leg should have results, the other empty
    const successLegs = results.filter((r) => r.results.length > 0);
    const failedLegs = results.filter((r) => r.results.length === 0);
    expect(successLegs.length + failedLegs.length).toBe(2);
    // Structure is preserved
    expect(results[0].fromIata).toBe("FRA");
    expect(results[1].fromIata).toBe("NRT");
  });
});
