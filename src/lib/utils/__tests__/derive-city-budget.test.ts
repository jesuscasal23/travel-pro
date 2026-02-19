// @vitest-environment node
import { describe, it, expect } from "vitest";
import { parseCostString, deriveCityBudgets } from "../derive-city-budget";
import type { CityStop, TripDay, TripBudget } from "@/types";

// ── parseCostString ──────────────────────────────────────────

describe("parseCostString", () => {
  it("parses simple euro amount", () => {
    expect(parseCostString("€25")).toBe(25);
  });

  it("parses range and returns average", () => {
    expect(parseCostString("€20–30")).toBe(25);
  });

  it("parses range with hyphen", () => {
    expect(parseCostString("€20-30")).toBe(25);
  });

  it("parses tilde prefix", () => {
    expect(parseCostString("~€12")).toBe(12);
  });

  it('returns 0 for "Free"', () => {
    expect(parseCostString("Free")).toBe(0);
  });

  it("returns 0 for empty string", () => {
    expect(parseCostString("")).toBe(0);
  });

  it("returns 0 for undefined", () => {
    expect(parseCostString(undefined)).toBe(0);
  });

  it("parses decimal values", () => {
    expect(parseCostString("€12.50")).toBe(12.5);
  });

  it('returns 0 for "€0"', () => {
    expect(parseCostString("€0")).toBe(0);
  });
});

// ── deriveCityBudgets ────────────────────────────────────────

function makeStop(city: string, country: string, days: number): CityStop {
  return { id: city.toLowerCase(), city, country, lat: 0, lng: 0, days, countryCode: "XX" };
}

function makeDay(city: string, activities: { cost?: string }[] = [{ cost: "€20" }]): TripDay {
  return {
    day: 1,
    date: "2026-03-01",
    city,
    activities: activities.map((a) => ({
      name: "Activity",
      category: "Culture",
      icon: "🏯",
      why: "Nice",
      duration: "2h",
      ...a,
    })),
  };
}

const budget: TripBudget = {
  flights: 1000,
  accommodation: 2000,
  activities: 800,
  food: 600,
  transport: 400,
  total: 4800,
  budget: 5000,
};

describe("deriveCityBudgets", () => {
  it("allocates budget proportionally to days per city", () => {
    const route = [makeStop("Tokyo", "Japan", 5), makeStop("Bangkok", "Thailand", 5)];
    const days = [
      ...Array.from({ length: 5 }, () => makeDay("Tokyo")),
      ...Array.from({ length: 5 }, () => makeDay("Bangkok")),
    ];

    const result = deriveCityBudgets(route, days, budget);
    expect(result).toHaveLength(2);
    // 50/50 split for accommodation
    expect(result[0].stays).toBe(1000);
    expect(result[1].stays).toBe(1000);
    // food and transport also 50/50
    expect(result[0].food).toBe(300);
    expect(result[1].food).toBe(300);
  });

  it("uses parsed activity costs when available", () => {
    const route = [makeStop("Tokyo", "Japan", 2)];
    const days = [
      makeDay("Tokyo", [{ cost: "€50" }, { cost: "€30" }]),
      makeDay("Tokyo", [{ cost: "€20" }]),
    ];

    const result = deriveCityBudgets(route, days, budget);
    expect(result[0].activities).toBe(100); // 50 + 30 + 20 = 100
  });

  it("falls back to ratio allocation when activity costs are zero", () => {
    const route = [makeStop("Tokyo", "Japan", 3)];
    const days = [
      makeDay("Tokyo", [{ cost: "Free" }]),
      makeDay("Tokyo", [{ cost: "" }]),
      makeDay("Tokyo", [{ cost: undefined }]),
    ];

    const result = deriveCityBudgets(route, days, budget);
    // All costs parsed to 0, so should fall back to ratio * budget.activities
    expect(result[0].activities).toBe(budget.activities); // 100% ratio
  });

  it("handles empty days array", () => {
    const route = [makeStop("Tokyo", "Japan", 3)];
    const result = deriveCityBudgets(route, [], budget);
    expect(result).toHaveLength(1);
    // Falls back to stop.days (3), totalDays = 1 (from || 1)
    expect(result[0].days).toBe(3);
  });

  it("returns correct total for each city", () => {
    const route = [makeStop("Tokyo", "Japan", 10)];
    const days = Array.from({ length: 10 }, () => makeDay("Tokyo", [{ cost: "€10" }]));

    const result = deriveCityBudgets(route, days, budget);
    expect(result[0].total).toBe(
      result[0].stays + result[0].activities + result[0].food + result[0].transport
    );
  });
});
