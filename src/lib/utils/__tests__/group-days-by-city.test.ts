import { describe, it, expect } from "vitest";
import { groupDaysByCity } from "../group-days-by-city";
import type { TripDay, CityStop } from "@/types";

function makeDay(day: number, city: string): TripDay {
  return { day, date: `Apr ${day}`, city, activities: [] };
}

function makeRoute(...cities: [string, string][]): CityStop[] {
  return cities.map(([city, country], i) => ({
    id: `city-${i}`,
    city,
    country,
    lat: 0,
    lng: 0,
    days: 3,
    countryCode: country.slice(0, 2).toUpperCase(),
  }));
}

describe("groupDaysByCity", () => {
  it("groups consecutive days for the same city", () => {
    const route = makeRoute(["Tokyo", "Japan"], ["Kyoto", "Japan"]);
    const days = [makeDay(1, "Tokyo"), makeDay(2, "Tokyo"), makeDay(3, "Kyoto")];

    const result = groupDaysByCity(days, route);

    expect(result).toHaveLength(2);
    expect(result[0].city).toBe("Tokyo");
    expect(result[0].days).toHaveLength(2);
    expect(result[1].city).toBe("Kyoto");
    expect(result[1].days).toHaveLength(1);
  });

  it("returns empty array for empty days", () => {
    const route = makeRoute(["Tokyo", "Japan"]);
    expect(groupDaysByCity([], route)).toEqual([]);
  });

  it("handles city revisits as separate groups", () => {
    const route = makeRoute(["Tokyo", "Japan"], ["Kyoto", "Japan"]);
    const days = [
      makeDay(1, "Tokyo"),
      makeDay(2, "Kyoto"),
      makeDay(3, "Tokyo"),
    ];

    const result = groupDaysByCity(days, route);

    expect(result).toHaveLength(3);
    expect(result[0].city).toBe("Tokyo");
    expect(result[1].city).toBe("Kyoto");
    expect(result[2].city).toBe("Tokyo");
  });

  it("assigns correct cityIndex from route", () => {
    const route = makeRoute(["Tokyo", "Japan"], ["Kyoto", "Japan"], ["Osaka", "Japan"]);
    const days = [makeDay(1, "Kyoto"), makeDay(2, "Osaka")];

    const result = groupDaysByCity(days, route);

    expect(result[0].cityIndex).toBe(1); // Kyoto is index 1 in route
    expect(result[1].cityIndex).toBe(2); // Osaka is index 2
  });

  it("falls back gracefully for a city not in the route", () => {
    const route = makeRoute(["Tokyo", "Japan"]);
    const days = [makeDay(1, "Unknown City")];

    const result = groupDaysByCity(days, route);

    expect(result).toHaveLength(1);
    expect(result[0].cityId).toBe("unknown city");
    expect(result[0].country).toBe("");
    expect(result[0].cityIndex).toBe(0); // falls back to groups.length
  });

  it("assigns cityId from route when available", () => {
    const route = makeRoute(["Tokyo", "Japan"]);
    const days = [makeDay(1, "Tokyo")];

    const result = groupDaysByCity(days, route);

    expect(result[0].cityId).toBe("city-0");
  });

  it("handles single-city itinerary", () => {
    const route = makeRoute(["Paris", "France"]);
    const days = [makeDay(1, "Paris"), makeDay(2, "Paris"), makeDay(3, "Paris")];

    const result = groupDaysByCity(days, route);

    expect(result).toHaveLength(1);
    expect(result[0].city).toBe("Paris");
    expect(result[0].country).toBe("France");
    expect(result[0].days).toHaveLength(3);
  });
});
