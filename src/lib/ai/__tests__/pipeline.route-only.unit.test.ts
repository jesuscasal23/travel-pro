// @vitest-environment node
// ============================================================
// Unit tests for buildSingleCityRouteOnly
//
// Verifies that single-city route skeletons are built correctly
// from TripIntent data without any Claude API call.
// ============================================================

import { describe, it, expect } from "vitest";
import { buildSingleCityRouteOnly } from "@/lib/ai/pipeline";
import type { TripIntent } from "@/types";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const baseIntent: TripIntent = {
  id: "test-trip-1",
  tripType: "single-city",
  region: "",
  destination: "Barcelona",
  destinationCountry: "Spain",
  destinationCountryCode: "ES",
  destinationLat: 41.39,
  destinationLng: 2.17,
  dateStart: "2026-04-10",
  dateEnd: "2026-04-17", // 7 days
  travelers: 2,
};

// ── Route shape ───────────────────────────────────────────────────────────────

describe("buildSingleCityRouteOnly — route", () => {
  it("returns exactly one city in route[]", () => {
    const { route } = buildSingleCityRouteOnly(baseIntent);
    expect(route).toHaveLength(1);
  });

  it("sets city name from destination", () => {
    const { route } = buildSingleCityRouteOnly(baseIntent);
    expect(route[0].city).toBe("Barcelona");
  });

  it("sets country from destinationCountry", () => {
    const { route } = buildSingleCityRouteOnly(baseIntent);
    expect(route[0].country).toBe("Spain");
  });

  it("sets countryCode from destinationCountryCode", () => {
    const { route } = buildSingleCityRouteOnly(baseIntent);
    expect(route[0].countryCode).toBe("ES");
  });

  it("sets lat/lng from intent coordinates", () => {
    const { route } = buildSingleCityRouteOnly(baseIntent);
    expect(route[0].lat).toBe(41.39);
    expect(route[0].lng).toBe(2.17);
  });

  it("sets days count equal to trip duration", () => {
    const { route } = buildSingleCityRouteOnly(baseIntent);
    expect(route[0].days).toBe(7);
  });

  it("slugifies the city name into the id", () => {
    const { route } = buildSingleCityRouteOnly({ ...baseIntent, destination: "New York" });
    expect(route[0].id).toBe("new-york");
  });

  it("lowercases the id", () => {
    const { route } = buildSingleCityRouteOnly(baseIntent);
    expect(route[0].id).toBe("barcelona");
  });
});

// ── Days shape ────────────────────────────────────────────────────────────────

describe("buildSingleCityRouteOnly — days", () => {
  it("generates one day entry per trip day", () => {
    const { days } = buildSingleCityRouteOnly(baseIntent);
    expect(days).toHaveLength(7);
  });

  it("numbers days starting from 1", () => {
    const { days } = buildSingleCityRouteOnly(baseIntent);
    expect(days[0].day).toBe(1);
    expect(days[6].day).toBe(7);
  });

  it("assigns the destination city to every day", () => {
    const { days } = buildSingleCityRouteOnly(baseIntent);
    for (const day of days) {
      expect(day.city).toBe("Barcelona");
    }
  });

  it("sets isTravel to false for all days", () => {
    const { days } = buildSingleCityRouteOnly(baseIntent);
    for (const day of days) {
      expect(day.isTravel).toBe(false);
    }
  });

  it("returns empty activities arrays for all days", () => {
    const { days } = buildSingleCityRouteOnly(baseIntent);
    for (const day of days) {
      expect(day.activities).toEqual([]);
    }
  });

  it("formats the first day date from dateStart", () => {
    const { days } = buildSingleCityRouteOnly(baseIntent);
    expect(days[0].date).toBe("Apr 10");
  });

  it("increments dates correctly for subsequent days", () => {
    const { days } = buildSingleCityRouteOnly(baseIntent);
    expect(days[1].date).toBe("Apr 11");
    expect(days[6].date).toBe("Apr 16");
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe("buildSingleCityRouteOnly — edge cases", () => {
  it("defaults to 7 days when dates are missing", () => {
    const noDateIntent: TripIntent = { ...baseIntent, dateStart: "", dateEnd: "" };
    const { days } = buildSingleCityRouteOnly(noDateIntent);
    expect(days).toHaveLength(7);
  });

  it("handles a 1-day trip", () => {
    const oneDayIntent: TripIntent = {
      ...baseIntent,
      dateStart: "2026-06-01",
      dateEnd: "2026-06-02",
    };
    const { route, days } = buildSingleCityRouteOnly(oneDayIntent);
    expect(days).toHaveLength(1);
    expect(route[0].days).toBe(1);
  });

  it("handles missing destination fields with safe defaults", () => {
    const sparseIntent: TripIntent = {
      id: "sparse",
      tripType: "single-city",
      region: "",
      dateStart: "2026-05-01",
      dateEnd: "2026-05-04",
      travelers: 1,
    };
    const { route, days } = buildSingleCityRouteOnly(sparseIntent);
    expect(route[0].city).toBe("");
    expect(route[0].lat).toBe(0);
    expect(route[0].lng).toBe(0);
    expect(route[0].countryCode).toBe("");
    expect(days).toHaveLength(3);
  });
});
