import { describe, it, expect } from "vitest";
import { citiesWithActivities, cityHasActivities } from "@/lib/utils/trip/city-activities";
import type { Itinerary } from "@/types";

const baseItinerary: Itinerary = {
  route: [
    {
      id: "tokyo",
      city: "Tokyo",
      country: "Japan",
      lat: 35.68,
      lng: 139.69,
      days: 3,
      countryCode: "JP",
    },
    {
      id: "kyoto",
      city: "Kyoto",
      country: "Japan",
      lat: 35.01,
      lng: 135.77,
      days: 2,
      countryCode: "JP",
    },
    {
      id: "osaka",
      city: "Osaka",
      country: "Japan",
      lat: 34.69,
      lng: 135.5,
      days: 2,
      countryCode: "JP",
    },
  ],
  days: [
    {
      day: 1,
      date: "Oct 1",
      city: "Tokyo",
      activities: [
        { name: "Senso-ji", category: "culture", icon: "⛩️", why: "Great", duration: "2h" },
      ],
    },
    {
      day: 2,
      date: "Oct 2",
      city: "Tokyo",
      activities: [
        { name: "Shibuya", category: "explore", icon: "🏙️", why: "Fun", duration: "3h" },
      ],
    },
    { day: 3, date: "Oct 3", city: "Tokyo", activities: [] },
    { day: 4, date: "Oct 4", city: "Kyoto", activities: [] },
    { day: 5, date: "Oct 5", city: "Kyoto", activities: [] },
    { day: 6, date: "Oct 6", city: "Osaka", activities: [] },
    { day: 7, date: "Oct 7", city: "Osaka", activities: [] },
  ],
};

describe("citiesWithActivities", () => {
  it("returns only cities that have at least one activity", () => {
    const result = citiesWithActivities(baseItinerary);
    expect(result).toEqual(new Set(["tokyo"]));
  });

  it("returns empty set when no activities exist", () => {
    const noActivities: Itinerary = {
      ...baseItinerary,
      days: baseItinerary.days.map((d) => ({ ...d, activities: [] })),
    };
    const result = citiesWithActivities(noActivities);
    expect(result.size).toBe(0);
  });

  it("returns all cities when all have activities", () => {
    const allActivities: Itinerary = {
      ...baseItinerary,
      days: baseItinerary.days.map((d) => ({
        ...d,
        activities: [{ name: "Test", category: "explore", icon: "🏙️", why: "Fun", duration: "1h" }],
      })),
    };
    const result = citiesWithActivities(allActivities);
    expect(result).toEqual(new Set(["tokyo", "kyoto", "osaka"]));
  });
});

describe("cityHasActivities", () => {
  it("returns true for city with activities", () => {
    expect(cityHasActivities(baseItinerary, "tokyo")).toBe(true);
  });

  it("returns false for city without activities", () => {
    expect(cityHasActivities(baseItinerary, "kyoto")).toBe(false);
  });

  it("returns false for unknown city", () => {
    expect(cityHasActivities(baseItinerary, "unknown")).toBe(false);
  });
});
