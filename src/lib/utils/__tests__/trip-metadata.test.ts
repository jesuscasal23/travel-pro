import { describe, it, expect } from "vitest";
import {
  isSingleCity,
  getTripTitle,
  getUniqueCountries,
  parseItineraryData,
} from "../trip/trip-metadata";
import type { CityStop, Itinerary } from "@/types";

// ── Fixtures ────────────────────────────────────────────────────

const tokyo: CityStop = {
  id: "tokyo",
  city: "Tokyo",
  country: "Japan",
  lat: 35.68,
  lng: 139.69,
  days: 5,
  countryCode: "JP",
};

const bangkok: CityStop = {
  id: "bangkok",
  city: "Bangkok",
  country: "Thailand",
  lat: 13.75,
  lng: 100.52,
  days: 4,
  countryCode: "TH",
};

const kyoto: CityStop = {
  id: "kyoto",
  city: "Kyoto",
  country: "Japan",
  lat: 35.01,
  lng: 135.77,
  days: 3,
  countryCode: "JP",
};

function makeItinerary(route: CityStop[]): Itinerary {
  return {
    route,
    days: [],
    visaData: [],
    weatherData: [],
  };
}

// ── isSingleCity ────────────────────────────────────────────────

describe("isSingleCity", () => {
  it("returns true for a single-city itinerary", () => {
    expect(isSingleCity(makeItinerary([tokyo]))).toBe(true);
  });

  it("returns false for a multi-city itinerary", () => {
    expect(isSingleCity(makeItinerary([tokyo, bangkok]))).toBe(false);
  });
});

// ── getTripTitle ────────────────────────────────────────────────

describe("getTripTitle", () => {
  it("returns 'City, Country' for a single-city route", () => {
    expect(getTripTitle([tokyo])).toBe("Tokyo, Japan");
  });

  it("returns joined country names for multi-city with different countries", () => {
    expect(getTripTitle([tokyo, bangkok])).toBe("Japan, Thailand");
  });

  it("deduplicates countries when multiple cities are in the same country", () => {
    expect(getTripTitle([tokyo, kyoto, bangkok])).toBe("Japan, Thailand");
  });
});

// ── getUniqueCountries ──────────────────────────────────────────

describe("getUniqueCountries", () => {
  it("returns unique country names", () => {
    expect(getUniqueCountries([tokyo, kyoto, bangkok])).toEqual(["Japan", "Thailand"]);
  });

  it("returns single country for single-city route", () => {
    expect(getUniqueCountries([tokyo])).toEqual(["Japan"]);
  });
});

describe("parseItineraryData", () => {
  it("returns typed itinerary data when the stored JSON shape is valid", () => {
    expect(parseItineraryData(makeItinerary([tokyo]))).toEqual(makeItinerary([tokyo]));
  });

  it("throws when the stored JSON shape is invalid", () => {
    expect(() => parseItineraryData({ route: "bad", days: [] })).toThrow(
      /Stored itinerary data is invalid/
    );
  });
});
