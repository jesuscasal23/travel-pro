import { describe, it, expect } from "vitest";
import { generatePackingList } from "../generate-packing-list";
import type { CityStop, TripDay, VisaInfo, CityWeather } from "@/types";

function makeRoute(): CityStop[] {
  return [
    {
      id: "bangkok",
      city: "Bangkok",
      country: "Thailand",
      countryCode: "TH",
      lat: 13.75,
      lng: 100.5,
      days: 3,
    },
    {
      id: "paris",
      city: "Paris",
      country: "France",
      countryCode: "FR",
      lat: 48.85,
      lng: 2.35,
      days: 2,
    },
  ];
}

describe("generatePackingList", () => {
  it("adds weather, destination, activity, visa, duration, and adapter-specific items", () => {
    const weatherData: CityWeather[] = [
      { city: "Bangkok", temp: "32C", condition: "Tropical showers", icon: "sun" },
      { city: "Paris", temp: "18C", condition: "Light rain", icon: "rain" },
    ];
    const visaData: VisaInfo[] = [
      {
        country: "Thailand",
        countryCode: "TH",
        requirement: "e-visa",
        maxStayDays: 30,
        notes: "",
        icon: "",
        label: "eVisa",
        sourceUrl: "#",
        sourceLabel: "Official",
      },
    ];
    const days: TripDay[] = [
      {
        day: 1,
        date: "2026-06-01",
        city: "Bangkok",
        activities: [
          { name: "Temple visit", category: "Culture", why: "", duration: "2h" },
          { name: "Beach time", category: "Leisure", why: "", duration: "2h" },
        ],
      },
      ...Array.from({ length: 14 }, (_, i) => ({
        day: i + 2,
        date: `2026-06-${String(i + 2).padStart(2, "0")}`,
        city: "Paris",
        activities: [{ name: "Walk", category: "General", why: "", duration: "1h" }],
      })),
    ];

    const items = generatePackingList(weatherData, visaData, makeRoute(), days);
    const ids = new Set(items.map((i) => i.id));

    expect(ids.has("layers")).toBe(true);
    expect(ids.has("sunscreen")).toBe(true);
    expect(ids.has("breathable")).toBe(true);
    expect(ids.has("umbrella")).toBe(true);
    expect(ids.has("quick-dry")).toBe(true);
    expect(ids.has("modest-cover")).toBe(true);
    expect(ids.has("swimwear")).toBe(true);
    expect(ids.has("power-adapter")).toBe(true);
    expect(ids.has("visa-printout")).toBe(true);
    expect(ids.has("laundry-kit")).toBe(true);
    expect(ids.has("first-aid")).toBe(true);
    expect(ids.has("medications")).toBe(true);
  });

  it("deduplicates items and falls back to default temperature parsing", () => {
    const weatherData: CityWeather[] = [
      { city: "City A", temp: "unknown", condition: "humid", icon: "" },
      { city: "City B", temp: "31C", condition: "monsoon rain", icon: "" },
    ];
    const route: CityStop[] = [
      {
        id: "one",
        city: "City A",
        country: "Testland",
        countryCode: "TH",
        lat: 0,
        lng: 0,
        days: 2,
      },
      {
        id: "two",
        city: "City B",
        country: "France",
        countryCode: "FR",
        lat: 0,
        lng: 0,
        days: 2,
      },
    ];
    const items = generatePackingList(weatherData, [], route, []);
    const umbrellas = items.filter((i) => i.id === "umbrella");
    const adapters = items.filter((i) => i.id === "power-adapter");

    expect(umbrellas).toHaveLength(1);
    expect(adapters).toHaveLength(1);
    expect(adapters[0].label).toContain("Type");
  });
});
