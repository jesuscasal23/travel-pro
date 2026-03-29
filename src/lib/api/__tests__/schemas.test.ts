// @vitest-environment node
import { describe, it, expect } from "vitest";
import { profileForAISchema as ProfileInputSchema } from "@/lib/schemas";
import { TripIntentInputSchema } from "@/lib/features/trips/schemas";
import { FlightSearchInputSchema } from "@/lib/features/trips/schemas";

// ── ProfileInputSchema ───────────────────────────────────────

describe("ProfileInputSchema", () => {
  const valid = {
    nationality: "German",
    homeAirport: "FRA",
    travelStyle: "smart-budget" as const,
    interests: ["Culture", "Food"],
  };

  it("accepts valid profile", () => {
    const result = ProfileInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects empty nationality", () => {
    const result = ProfileInputSchema.safeParse({ ...valid, nationality: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid travelStyle", () => {
    const result = ProfileInputSchema.safeParse({ ...valid, travelStyle: "ultra-luxury" });
    expect(result.success).toBe(false);
  });

  it("rejects more than 10 interests", () => {
    const result = ProfileInputSchema.safeParse({
      ...valid,
      interests: Array.from({ length: 11 }, (_, i) => `interest-${i}`),
    });
    expect(result.success).toBe(false);
  });

  it("rejects interest strings over 50 chars", () => {
    const result = ProfileInputSchema.safeParse({
      ...valid,
      interests: ["a".repeat(51)],
    });
    expect(result.success).toBe(false);
  });

  it("accepts all four travelStyle values", () => {
    for (const style of ["backpacker", "smart-budget", "comfort-explorer", "luxury"]) {
      const result = ProfileInputSchema.safeParse({ ...valid, travelStyle: style });
      expect(result.success).toBe(true);
    }
  });
});

// ── TripIntentInputSchema ────────────────────────────────────

describe("TripIntentInputSchema", () => {
  const validMultiCity = {
    id: "trip-1",
    tripType: "multi-city",
    region: "Southeast Asia",
    dateStart: "2026-03-01",
    dateEnd: "2026-03-15",
    travelers: 2,
  };

  const validSingleCity = {
    ...validMultiCity,
    tripType: "single-city",
    region: "",
    destination: "Tokyo",
    destinationCountry: "Japan",
  };

  it("accepts valid multi-city trip", () => {
    const result = TripIntentInputSchema.safeParse(validMultiCity);
    expect(result.success).toBe(true);
  });

  it("accepts valid single-city trip", () => {
    const result = TripIntentInputSchema.safeParse(validSingleCity);
    expect(result.success).toBe(true);
  });

  it("defaults tripType to multi-city", () => {
    const { tripType: _unused, ...rest } = validMultiCity;
    const result = TripIntentInputSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tripType).toBe("multi-city");
    }
  });

  it("accepts multi-city without region (cities are passed separately)", () => {
    const result = TripIntentInputSchema.safeParse({ ...validMultiCity, region: "" });
    expect(result.success).toBe(true);
  });

  it("rejects single-city without destination", () => {
    const result = TripIntentInputSchema.safeParse({
      ...validSingleCity,
      destination: undefined,
    });
    expect(result.success).toBe(false);
  });

  it("rejects travelers outside 1-20 range", () => {
    expect(TripIntentInputSchema.safeParse({ ...validMultiCity, travelers: 0 }).success).toBe(
      false
    );
    expect(TripIntentInputSchema.safeParse({ ...validMultiCity, travelers: 21 }).success).toBe(
      false
    );
  });

  it("rejects non-integer travelers", () => {
    const result = TripIntentInputSchema.safeParse({ ...validMultiCity, travelers: 2.5 });
    expect(result.success).toBe(false);
  });
});

// ── FlightSearchInputSchema ────────────────────────────────

describe("FlightSearchInputSchema", () => {
  const valid = {
    fromIata: "CDG",
    toIata: "NRT",
    departureDate: "2026-06-01",
    travelers: 2,
  };

  it("accepts valid flight search input", () => {
    const result = FlightSearchInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("uppercases IATA codes", () => {
    const result = FlightSearchInputSchema.safeParse({ ...valid, fromIata: "cdg", toIata: "nrt" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fromIata).toBe("CDG");
      expect(result.data.toIata).toBe("NRT");
    }
  });

  it("rejects IATA codes that are not exactly 3 characters", () => {
    expect(FlightSearchInputSchema.safeParse({ ...valid, fromIata: "AB" }).success).toBe(false);
    expect(FlightSearchInputSchema.safeParse({ ...valid, fromIata: "ABCD" }).success).toBe(false);
  });

  it("rejects invalid date format", () => {
    expect(
      FlightSearchInputSchema.safeParse({ ...valid, departureDate: "01-06-2026" }).success
    ).toBe(false);
    expect(
      FlightSearchInputSchema.safeParse({ ...valid, departureDate: "2026/06/01" }).success
    ).toBe(false);
    expect(FlightSearchInputSchema.safeParse({ ...valid, departureDate: "20260601" }).success).toBe(
      false
    );
  });

  it("accepts valid YYYY-MM-DD date", () => {
    const result = FlightSearchInputSchema.safeParse({ ...valid, departureDate: "2026-12-31" });
    expect(result.success).toBe(true);
  });

  it("rejects travelers outside 1-20 range", () => {
    expect(FlightSearchInputSchema.safeParse({ ...valid, travelers: 0 }).success).toBe(false);
    expect(FlightSearchInputSchema.safeParse({ ...valid, travelers: 21 }).success).toBe(false);
  });

  it("rejects non-integer travelers", () => {
    expect(FlightSearchInputSchema.safeParse({ ...valid, travelers: 1.5 }).success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(FlightSearchInputSchema.safeParse({ fromIata: "CDG" }).success).toBe(false);
    expect(FlightSearchInputSchema.safeParse({}).success).toBe(false);
  });
});
