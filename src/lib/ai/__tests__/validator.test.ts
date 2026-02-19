// @vitest-environment node
import { describe, it, expect } from "vitest";
import { validateItinerary, buildRetryPrompt } from "../validator";
import type { Itinerary, CityStop, TripDay, TripBudget } from "@/types";

// ── Helpers ──────────────────────────────────────────────────

function makeRoute(...cities: string[]): CityStop[] {
  return cities.map((city, i) => ({
    id: city.toLowerCase(),
    city,
    country: city === "Tokyo" || city === "Osaka" ? "Japan" : city === "Hanoi" ? "Vietnam" : city === "Bangkok" ? "Thailand" : "Unknown",
    lat: 35 + i,
    lng: 139 + i,
    days: 3,
    countryCode: city === "Tokyo" || city === "Osaka" ? "JP" : city === "Hanoi" ? "VN" : city === "Bangkok" ? "TH" : "XX",
  }));
}

function makeDay(day: number, city: string, activities: Partial<import("@/types").DayActivity>[] = [{}]): TripDay {
  return {
    day,
    date: `2026-03-${String(day).padStart(2, "0")}`,
    city,
    activities: activities.map((a) => ({
      name: a.name ?? "Activity",
      category: a.category ?? "Culture",
      icon: a.icon ?? "🏯",
      why: a.why ?? "Worth visiting",
      duration: a.duration ?? "2h",
      tip: a.tip ?? "Book ahead",
      food: a.food ?? "Try ramen",
      cost: a.cost ?? "€20",
    })),
  };
}

function makeBudget(total: number, ceiling: number): TripBudget {
  return { flights: 800, accommodation: 1000, activities: 500, food: 400, transport: 200, total, budget: ceiling };
}

function makeItinerary(overrides: Partial<Itinerary> = {}): Itinerary {
  return {
    route: makeRoute("Tokyo"),
    days: [makeDay(1, "Tokyo")],
    budget: makeBudget(3000, 5000),
    visaData: [],
    weatherData: [],
    ...overrides,
  };
}

// ── validateItinerary ────────────────────────────────────────

describe("validateItinerary", () => {
  it("returns valid for a complete itinerary", () => {
    const result = validateItinerary(makeItinerary(), 5000);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("errors when route is empty", () => {
    const result = validateItinerary(makeItinerary({ route: [] }), 5000);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Route is empty");
  });

  it("errors when days array is empty", () => {
    const result = validateItinerary(makeItinerary({ days: [] }), 5000);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("No days"))).toBe(true);
  });

  it("errors when budget data is missing", () => {
    const result = validateItinerary(makeItinerary({ budget: undefined as unknown as TripBudget }), 5000);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Budget data is missing"))).toBe(true);
  });

  it("warns on budget exceeding ceiling by more than 5%", () => {
    const result = validateItinerary(makeItinerary({ budget: makeBudget(5600, 5000) }), 5000);
    expect(result.valid).toBe(true); // warnings don't block validity
    expect(result.warnings.some((w) => w.includes("Budget exceeds ceiling"))).toBe(true);
  });

  it("does not warn when budget is within 5% of ceiling", () => {
    // 5250 / 5000 = 105% exactly — should not trigger (threshold is >105%)
    const result = validateItinerary(makeItinerary({ budget: makeBudget(5250, 5000) }), 5000);
    expect(result.warnings.some((w) => w.includes("Budget exceeds"))).toBe(false);
  });

  it("warns on duplicate cities", () => {
    const result = validateItinerary(
      makeItinerary({ route: makeRoute("Tokyo", "Tokyo") }),
      5000
    );
    expect(result.warnings.some((w) => w.includes("Duplicate cities"))).toBe(true);
  });

  it("warns on route backtracking", () => {
    const result = validateItinerary(
      makeItinerary({ route: makeRoute("Tokyo", "Hanoi", "Tokyo") }),
      5000
    );
    expect(result.warnings.some((w) => w.includes("backtracking"))).toBe(true);
  });

  it("detects missing required fields on activities", () => {
    const dayWithMissing: TripDay = {
      day: 1,
      date: "2026-03-01",
      city: "Tokyo",
      activities: [
        { name: "Visit temple", category: "", icon: "🏯", why: "Nice", duration: "2h", tip: "", food: "", cost: "" },
      ],
    };
    const result = validateItinerary(makeItinerary({ days: [dayWithMissing] }), 5000);
    expect(result.valid).toBe(false);
    expect(result.missingFields.length).toBeGreaterThan(0);
  });

  it("skips travel days for completeness check", () => {
    const travelDay: TripDay = {
      day: 2,
      date: "2026-03-02",
      city: "Tokyo",
      isTravel: true,
      travelFrom: "Tokyo",
      travelTo: "Osaka",
      activities: [],
    };
    const result = validateItinerary(
      makeItinerary({ days: [makeDay(1, "Tokyo"), travelDay] }),
      5000
    );
    expect(result.valid).toBe(true);
  });
});

// ── buildRetryPrompt ─────────────────────────────────────────

describe("buildRetryPrompt", () => {
  it("generates prompt for missing fields", () => {
    const prompt = buildRetryPrompt([
      { day: 1, activityIndex: 0, activityName: "Visit temple", missingFields: ["tip", "cost"] },
    ]);
    expect(prompt).toContain("Day 1");
    expect(prompt).toContain("Visit temple");
    expect(prompt).toContain("tip, cost");
    expect(prompt).toContain("8 required fields");
  });

  it("handles multiple activities", () => {
    const prompt = buildRetryPrompt([
      { day: 1, activityIndex: 0, activityName: "A", missingFields: ["tip"] },
      { day: 3, activityIndex: 1, activityName: "B", missingFields: ["food", "cost"] },
    ]);
    expect(prompt).toContain("Day 1");
    expect(prompt).toContain("Day 3");
  });

  it("returns empty list instruction for no missing fields", () => {
    const prompt = buildRetryPrompt([]);
    expect(prompt).toContain("JSON array");
  });
});
