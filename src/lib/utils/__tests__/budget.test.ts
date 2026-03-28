import { describe, it, expect } from "vitest";
import { parseCost, deriveCityActivityBudgets, computeBudgetSummary } from "@/lib/utils/budget";
import type { Itinerary, FlightSelection, HotelSelection } from "@/types";

describe("parseCost", () => {
  it("parses simple euro amounts", () => {
    expect(parseCost("€45")).toBe(45);
    expect(parseCost("€100")).toBe(100);
  });

  it("parses dollar and pound amounts", () => {
    expect(parseCost("$30")).toBe(30);
    expect(parseCost("£25")).toBe(25);
  });

  it("parses approximate values", () => {
    expect(parseCost("~€100")).toBe(100);
    expect(parseCost("≈€50")).toBe(50);
  });

  it("parses ranges as midpoint", () => {
    expect(parseCost("€10-15")).toBe(12.5);
    expect(parseCost("€20 - 40")).toBe(30);
    expect(parseCost("$100–200")).toBe(150);
  });

  it("returns 0 for free", () => {
    expect(parseCost("Free")).toBe(0);
    expect(parseCost("free")).toBe(0);
    expect(parseCost("0")).toBe(0);
  });

  it("returns null for unparseable strings", () => {
    expect(parseCost(undefined)).toBeNull();
    expect(parseCost(null)).toBeNull();
    expect(parseCost("")).toBeNull();
    expect(parseCost("varies")).toBeNull();
  });
});

describe("deriveCityActivityBudgets", () => {
  it("groups activity costs by city", () => {
    const days = [
      {
        day: 1,
        date: "2026-04-01",
        city: "Paris",
        activities: [
          { name: "Eiffel Tower", category: "sightseeing", why: "", duration: "2h", cost: "€25" },
          { name: "Louvre", category: "culture", why: "", duration: "3h", cost: "€17" },
        ],
      },
      {
        day: 2,
        date: "2026-04-02",
        city: "Rome",
        activities: [
          { name: "Colosseum", category: "sightseeing", why: "", duration: "2h", cost: "€16" },
        ],
      },
    ];

    const result = deriveCityActivityBudgets(days);
    expect(result).toHaveLength(2);
    expect(result[0].city).toBe("Paris");
    expect(result[0].total).toBe(42);
    expect(result[1].city).toBe("Rome");
    expect(result[1].total).toBe(16);
  });

  it("deduplicates activities across days in the same city", () => {
    const days = [
      {
        day: 1,
        date: "2026-04-01",
        city: "Paris",
        activities: [
          { name: "Eiffel Tower", category: "sightseeing", why: "", duration: "2h", cost: "€25" },
        ],
      },
      {
        day: 2,
        date: "2026-04-02",
        city: "Paris",
        activities: [
          { name: "Eiffel Tower", category: "sightseeing", why: "", duration: "2h", cost: "€25" },
        ],
      },
    ];

    const result = deriveCityActivityBudgets(days);
    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(1);
    expect(result[0].total).toBe(25);
  });

  it("skips activities with no parseable cost", () => {
    const days = [
      {
        day: 1,
        date: "2026-04-01",
        city: "Paris",
        activities: [
          { name: "Walking tour", category: "sightseeing", why: "", duration: "2h", cost: "Free" },
          { name: "Museum", category: "culture", why: "", duration: "3h" },
        ],
      },
    ];

    const result = deriveCityActivityBudgets(days);
    expect(result).toHaveLength(0);
  });
});

describe("computeBudgetSummary", () => {
  const baseItinerary: Itinerary = {
    route: [],
    days: [
      {
        day: 1,
        date: "2026-04-01",
        city: "Paris",
        activities: [
          { name: "Eiffel Tower", category: "sightseeing", why: "", duration: "2h", cost: "€25" },
        ],
      },
    ],
  };

  it("returns null values when no data available", () => {
    const result = computeBudgetSummary(null, undefined, undefined);
    expect(result.flights).toBeNull();
    expect(result.hotels).toBeNull();
    expect(result.activities).toBeNull();
    expect(result.grandTotal).toBeNull();
  });

  it("uses flight selections when available", () => {
    const selections = [{ price: 200 } as FlightSelection, { price: 180 } as FlightSelection];
    const result = computeBudgetSummary(baseItinerary, selections, undefined);
    expect(result.flights).toEqual({ total: 380, source: "selections" });
  });

  it("falls back to flightOptions when no selections", () => {
    const itinerary: Itinerary = {
      ...baseItinerary,
      flightOptions: [
        {
          fromIata: "CDG",
          toIata: "FCO",
          departureDate: "2026-04-01",
          results: [
            {
              price: 120,
              duration: "2h",
              airline: "AF",
              stops: 0,
              departureTime: "",
              arrivalTime: "",
              cabin: "ECONOMY",
              bookingUrl: "",
            },
          ],
          fetchedAt: Date.now(),
        },
      ],
    };
    const result = computeBudgetSummary(itinerary, undefined, undefined);
    expect(result.flights).toEqual({ total: 120, source: "search" });
  });

  it("uses hotel selections when available", () => {
    const selections = [
      { totalPrice: 400 } as HotelSelection,
      { totalPrice: 300 } as HotelSelection,
    ];
    const result = computeBudgetSummary(baseItinerary, undefined, selections);
    expect(result.hotels).toEqual({ total: 700, source: "selections" });
  });

  it("computes grand total from available categories only", () => {
    const flights = [{ price: 200 } as FlightSelection];
    const result = computeBudgetSummary(baseItinerary, flights, undefined);
    // flights: 200, activities: 25, hotels: null
    expect(result.grandTotal).toBe(225);
    expect(result.hotels).toBeNull();
  });
});
