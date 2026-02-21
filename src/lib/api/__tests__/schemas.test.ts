// @vitest-environment node
import { describe, it, expect } from "vitest";
import { ProfileInputSchema, TripIntentInputSchema, CityWithDaysInputSchema } from "../schemas";

// ── ProfileInputSchema ───────────────────────────────────────

describe("ProfileInputSchema", () => {
  const valid = {
    nationality: "German",
    homeAirport: "FRA",
    travelStyle: "comfort" as const,
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

  it("accepts all three travelStyle values", () => {
    for (const style of ["backpacker", "comfort", "luxury"]) {
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
    flexibleDates: true,
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
    const { tripType: _tripType, ...rest } = validMultiCity;
    const result = TripIntentInputSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tripType).toBe("multi-city");
    }
  });

  it("rejects multi-city without region", () => {
    const result = TripIntentInputSchema.safeParse({ ...validMultiCity, region: "" });
    expect(result.success).toBe(false);
  });

  it("rejects single-city without destination", () => {
    const result = TripIntentInputSchema.safeParse({
      ...validSingleCity,
      destination: undefined,
    });
    expect(result.success).toBe(false);
  });

  it("rejects travelers outside 1-20 range", () => {
    expect(TripIntentInputSchema.safeParse({ ...validMultiCity, travelers: 0 }).success).toBe(false);
    expect(TripIntentInputSchema.safeParse({ ...validMultiCity, travelers: 21 }).success).toBe(false);
  });

  it("rejects non-integer travelers", () => {
    const result = TripIntentInputSchema.safeParse({ ...validMultiCity, travelers: 2.5 });
    expect(result.success).toBe(false);
  });
});

// ── CityWithDaysInputSchema ──────────────────────────────────

describe("CityWithDaysInputSchema", () => {
  const valid = {
    id: "tokyo",
    city: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    iataCode: "TYO",
    lat: 35.68,
    lng: 139.69,
    minDays: 3,
    maxDays: 5,
  };

  it("accepts valid city", () => {
    const result = CityWithDaysInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const { city, ...rest } = valid;
    const result = CityWithDaysInputSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects string where number expected", () => {
    const result = CityWithDaysInputSchema.safeParse({ ...valid, lat: "35.68" });
    expect(result.success).toBe(false);
  });
});
