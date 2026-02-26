// ============================================================
// Unit tests for recalculateTravelDays
//
// Covers:
//   - Empty route / days edge cases
//   - Single city: no travel days
//   - Two cities: boundary day marked as travel
//   - Three cities: two travel days
//   - Route reorder: travel days move to new boundaries
//   - Leftover days assigned to last city
//   - Stale travel flags cleared on non-travel days
// ============================================================

import { describe, it, expect } from "vitest";
import { recalculateTravelDays } from "@/lib/utils/recalculate-travel-days";
import type { TripDay, CityStop } from "@/types";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeCity(id: string, name: string, days: number): CityStop {
  return { id, city: name, country: "Test", lat: 0, lng: 0, days, countryCode: "XX" };
}

function makeDay(day: number, city: string, overrides: Partial<TripDay> = {}): TripDay {
  return {
    day,
    date: `2026-04-${String(day).padStart(2, "0")}`,
    city,
    activities: [],
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("recalculateTravelDays", () => {
  // ── Edge cases ─────────────────────────────────────────────────────────────

  it("returns days unchanged when route is empty", () => {
    const days = [makeDay(1, "Tokyo")];
    expect(recalculateTravelDays(days, [])).toBe(days);
  });

  it("returns days unchanged when days is empty", () => {
    const route = [makeCity("c1", "Tokyo", 3)];
    const result = recalculateTravelDays([], route);
    expect(result).toHaveLength(0);
  });

  // ── Single city ────────────────────────────────────────────────────────────

  it("marks no travel days for a single-city route", () => {
    const route = [makeCity("c1", "Tokyo", 3)];
    const days = [makeDay(1, "Tokyo"), makeDay(2, "Tokyo"), makeDay(3, "Tokyo")];
    const result = recalculateTravelDays(days, route);

    result.forEach((day) => {
      expect(day.isTravel).toBe(false);
      expect(day.travelFrom).toBeUndefined();
      expect(day.travelTo).toBeUndefined();
    });
  });

  // ── Two cities ─────────────────────────────────────────────────────────────

  it("marks last day of first city as travel day for 2-city route", () => {
    const route = [makeCity("c1", "Tokyo", 2), makeCity("c2", "Osaka", 2)];
    const days = [
      makeDay(1, "Tokyo"),
      makeDay(2, "Tokyo"),
      makeDay(3, "Osaka"),
      makeDay(4, "Osaka"),
    ];
    const result = recalculateTravelDays(days, route);

    expect(result[0].isTravel).toBe(false);
    expect(result[1].isTravel).toBe(true);
    expect(result[1].travelFrom).toBe("Tokyo");
    expect(result[1].travelTo).toBe("Osaka");
    expect(result[2].isTravel).toBe(false);
    expect(result[3].isTravel).toBe(false);
  });

  it("assigns correct city to each day", () => {
    const route = [makeCity("c1", "Tokyo", 2), makeCity("c2", "Osaka", 2)];
    const days = [makeDay(1, "??"), makeDay(2, "??"), makeDay(3, "??"), makeDay(4, "??")];
    const result = recalculateTravelDays(days, route);

    expect(result[0].city).toBe("Tokyo");
    expect(result[1].city).toBe("Tokyo");
    expect(result[2].city).toBe("Osaka");
    expect(result[3].city).toBe("Osaka");
  });

  // ── Three cities ───────────────────────────────────────────────────────────

  it("marks two travel days for a 3-city route", () => {
    const route = [
      makeCity("c1", "Tokyo", 2),
      makeCity("c2", "Osaka", 2),
      makeCity("c3", "Kyoto", 2),
    ];
    const days = [
      makeDay(1, "Tokyo"),
      makeDay(2, "Tokyo"),
      makeDay(3, "Osaka"),
      makeDay(4, "Osaka"),
      makeDay(5, "Kyoto"),
      makeDay(6, "Kyoto"),
    ];
    const result = recalculateTravelDays(days, route);

    // day 2: Tokyo → Osaka
    expect(result[1].isTravel).toBe(true);
    expect(result[1].travelFrom).toBe("Tokyo");
    expect(result[1].travelTo).toBe("Osaka");

    // day 4: Osaka → Kyoto
    expect(result[3].isTravel).toBe(true);
    expect(result[3].travelFrom).toBe("Osaka");
    expect(result[3].travelTo).toBe("Kyoto");

    // Others: not travel
    [0, 2, 4, 5].forEach((i) => expect(result[i].isTravel).toBe(false));
  });

  // ── Route reorder ──────────────────────────────────────────────────────────

  it("moves travel day boundary when route is reordered", () => {
    // Original: Tokyo(2) → Osaka(2), travel on day 2
    // New route: Osaka(2) → Tokyo(2), travel should still be on day 2 (now Osaka→Tokyo)
    const route = [makeCity("c2", "Osaka", 2), makeCity("c1", "Tokyo", 2)];
    const days = [
      makeDay(1, "Tokyo"),
      makeDay(2, "Tokyo"),
      makeDay(3, "Osaka"),
      makeDay(4, "Osaka"),
    ];
    const result = recalculateTravelDays(days, route);

    // Days 1-2 reassigned to Osaka, days 3-4 to Tokyo
    expect(result[0].city).toBe("Osaka");
    expect(result[1].city).toBe("Osaka");
    expect(result[2].city).toBe("Tokyo");
    expect(result[3].city).toBe("Tokyo");

    // Travel boundary is day 2 (Osaka → Tokyo)
    expect(result[1].isTravel).toBe(true);
    expect(result[1].travelFrom).toBe("Osaka");
    expect(result[1].travelTo).toBe("Tokyo");
  });

  // ── Stale travel flags ─────────────────────────────────────────────────────

  it("clears stale isTravel/travelFrom/travelTo on non-travel days", () => {
    const route = [makeCity("c1", "Tokyo", 4)];
    // Days that previously had travel flags
    const days = [
      makeDay(1, "Tokyo", {
        isTravel: true,
        travelFrom: "Seoul",
        travelTo: "Tokyo",
        travelDuration: "2h",
      }),
      makeDay(2, "Tokyo"),
      makeDay(3, "Tokyo"),
      makeDay(4, "Tokyo"),
    ];
    const result = recalculateTravelDays(days, route);

    result.forEach((day) => {
      expect(day.isTravel).toBe(false);
      expect(day.travelFrom).toBeUndefined();
      expect(day.travelTo).toBeUndefined();
      expect(day.travelDuration).toBeUndefined();
    });
  });

  it("clears travelDuration even on travel days", () => {
    const route = [makeCity("c1", "Tokyo", 2), makeCity("c2", "Osaka", 2)];
    const days = [
      makeDay(1, "Tokyo"),
      makeDay(2, "Tokyo", { travelDuration: "2h" }),
      makeDay(3, "Osaka"),
      makeDay(4, "Osaka"),
    ];
    const result = recalculateTravelDays(days, route);
    // Day 2 should be travel, but travelDuration cleared
    expect(result[1].isTravel).toBe(true);
    expect(result[1].travelDuration).toBeUndefined();
  });

  // ── Leftover days ──────────────────────────────────────────────────────────

  it("assigns leftover days to last city when days > route total", () => {
    const route = [makeCity("c1", "Tokyo", 2), makeCity("c2", "Osaka", 2)]; // 4 days total
    // 6 days provided
    const days = [
      makeDay(1, "?"),
      makeDay(2, "?"),
      makeDay(3, "?"),
      makeDay(4, "?"),
      makeDay(5, "?"),
      makeDay(6, "?"),
    ];
    const result = recalculateTravelDays(days, route);

    // Days 5+6 should be Osaka (last city)
    expect(result[4].city).toBe("Osaka");
    expect(result[5].city).toBe("Osaka");
  });

  // ── Preserves activities ───────────────────────────────────────────────────

  it("preserves existing activities on each day", () => {
    const route = [makeCity("c1", "Tokyo", 2)];
    const activity = { name: "Sushi", category: "Food", why: "Local", duration: "1h" };
    const days = [makeDay(1, "Tokyo", { activities: [activity] }), makeDay(2, "Tokyo")];
    const result = recalculateTravelDays(days, route);

    expect(result[0].activities).toEqual([activity]);
  });
});
