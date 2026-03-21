import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import type { Itinerary } from "@/types";
import { useTripStore } from "../useTripStore";

function resetTripStore() {
  act(() => {
    useTripStore.setState({
      nationality: "",
      homeAirport: "",
      travelStyle: "smart-budget",
      interests: [],
      planStep: 1,
      tripType: "multi-city",
      tripDescription: "",
      planningPriorities: [],
      region: "",
      destination: "",
      destinationCountry: "",
      destinationCountryCode: "",
      destinationLat: 0,
      destinationLng: 0,
      dateStart: "",
      dateEnd: "",
      travelers: 2,
      isGenerating: false,
      needsRegeneration: false,
      currentTripId: "",
      itinerary: null,
    });
  });
}

function makeItinerary(): Itinerary {
  return {
    route: [
      {
        id: "paris",
        city: "Paris",
        country: "France",
        countryCode: "FR",
        lat: 48.85,
        lng: 2.35,
        days: 2,
      },
    ],
    days: [
      {
        day: 1,
        date: "2026-06-01",
        city: "Paris",
        activities: [{ name: "Louvre", category: "Culture", why: "Art", duration: "2h" }],
      },
    ],
  };
}

describe("useTripStore", () => {
  beforeEach(() => {
    localStorage.clear();
    resetTripStore();
  });

  it("updates profile and plan fields with dedicated setters", () => {
    act(() => {
      const state = useTripStore.getState();
      state.setNationality("German");
      state.setHomeAirport("FRA");
      state.setTravelStyle("luxury");
      state.setPlanStep(4);
      state.setTripType("single-city");
      state.setPlanningPriorities(["Flight connections", "Visa & paperwork"]);
      state.setRegion("europe");
      state.setDateStart("2026-04-01");
      state.setDateEnd("2026-04-10");
      state.setTravelers(3);
    });

    const state = useTripStore.getState();
    expect(state.nationality).toBe("German");
    expect(state.homeAirport).toBe("FRA");
    expect(state.travelStyle).toBe("luxury");
    expect(state.planStep).toBe(4);
    expect(state.tripType).toBe("single-city");
    expect(state.planningPriorities).toEqual(["Flight connections", "Visa & paperwork"]);
    expect(state.region).toBe("europe");
    expect(state.dateStart).toBe("2026-04-01");
    expect(state.dateEnd).toBe("2026-04-10");
    expect(state.travelers).toBe(3);
  });

  it("toggles interests on and off", () => {
    act(() => {
      useTripStore.getState().toggleInterest("food");
      useTripStore.getState().toggleInterest("culture");
    });
    expect(useTripStore.getState().interests).toEqual(["food", "culture"]);

    act(() => {
      useTripStore.getState().toggleInterest("food");
    });
    expect(useTripStore.getState().interests).toEqual(["culture"]);
  });

  it("toggles planning priorities on and off", () => {
    act(() => {
      const state = useTripStore.getState();
      state.togglePlanningPriority("Flight connections");
      state.togglePlanningPriority("Visa & paperwork");
    });
    expect(useTripStore.getState().planningPriorities).toEqual([
      "Flight connections",
      "Visa & paperwork",
    ]);

    act(() => {
      useTripStore.getState().togglePlanningPriority("Flight connections");
    });
    expect(useTripStore.getState().planningPriorities).toEqual(["Visa & paperwork"]);
  });

  it("migrates a legacy persisted single planningPriority value", () => {
    const persistApi = useTripStore as typeof useTripStore & {
      persist: {
        getOptions: () => {
          merge?: (
            persistedState: unknown,
            currentState: ReturnType<typeof useTripStore.getState>
          ) => unknown;
        };
      };
    };

    const merge = persistApi.persist.getOptions().merge;
    expect(merge).toBeTypeOf("function");

    const merged = merge!(
      { planningPriority: "Flight connections" },
      useTripStore.getState()
    ) as ReturnType<typeof useTripStore.getState>;

    expect(merged.planningPriorities).toEqual(["Flight connections"]);
  });

  it("sets and clears destination details", () => {
    act(() => {
      useTripStore.getState().setDestination("Bangkok", "Thailand", "TH", 13.7563, 100.5018);
    });
    expect(useTripStore.getState().destination).toBe("Bangkok");
    expect(useTripStore.getState().destinationCountry).toBe("Thailand");
    expect(useTripStore.getState().destinationCountryCode).toBe("TH");
    expect(useTripStore.getState().destinationLat).toBe(13.7563);
    expect(useTripStore.getState().destinationLng).toBe(100.5018);

    act(() => {
      useTripStore.getState().clearDestination();
    });
    expect(useTripStore.getState().destination).toBe("");
    expect(useTripStore.getState().destinationCountry).toBe("");
    expect(useTripStore.getState().destinationCountryCode).toBe("");
    expect(useTripStore.getState().destinationLat).toBe(0);
    expect(useTripStore.getState().destinationLng).toBe(0);
  });

  it("updates generation flags and itinerary result fields", () => {
    const itinerary = makeItinerary();
    act(() => {
      const state = useTripStore.getState();
      state.setIsGenerating(true);
      state.setNeedsRegeneration(true);
      state.setCurrentTripId("trip-123");
      state.setItinerary(itinerary);
    });

    const state = useTripStore.getState();
    expect(state.isGenerating).toBe(true);
    expect(state.needsRegeneration).toBe(true);
    expect(state.currentTripId).toBe("trip-123");
    expect(state.itinerary).toEqual(itinerary);
  });

  it("resetPlan restores plan state without changing saved profile defaults", () => {
    act(() => {
      const state = useTripStore.getState();
      state.setNationality("German");
      state.setHomeAirport("FRA");
      state.setTravelStyle("backpacker");
      state.setTripType("single-city");
      state.setPlanningPriorities(["Flight connections"]);
      state.setRegion("asia");
      state.setDestination("Tokyo", "Japan", "JP", 35.67, 139.65);
      state.setDateStart("2026-05-01");
      state.setDateEnd("2026-05-15");
      state.setTravelers(4);
      state.setCurrentTripId("trip-999");
      state.setNeedsRegeneration(true);
      state.setItinerary(makeItinerary());
    });

    act(() => {
      useTripStore.getState().resetPlan();
    });

    const state = useTripStore.getState();
    expect(state.tripType).toBe("single-city");
    expect(state.planningPriorities).toEqual([]);
    expect(state.region).toBe("");
    expect(state.destination).toBe("");
    expect(state.dateStart).toBe("");
    expect(state.dateEnd).toBe("");
    expect(state.travelers).toBe(2);
    expect(state.currentTripId).toBe("");
    expect(state.itinerary).toBeNull();
    expect(state.needsRegeneration).toBe(false);
    expect(state.nationality).toBe("German");
    expect(state.homeAirport).toBe("FRA");
    expect(state.travelStyle).toBe("backpacker");
  });
});
