import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import type { Itinerary } from "@/types";
import { useTripStore } from "../useTripStore";

function resetTripStore() {
  act(() => {
    useTripStore.setState({
      onboardingStep: 1,
      nationality: "",
      homeAirport: "",
      travelStyle: "comfort",
      interests: [],
      planStep: 1,
      tripType: "multi-city",
      tripDescription: "",
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
      generationStep: 0,
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

  it("updates onboarding and plan fields with dedicated setters", () => {
    act(() => {
      const state = useTripStore.getState();
      state.setOnboardingStep(3);
      state.setNationality("German");
      state.setHomeAirport("FRA");
      state.setTravelStyle("luxury");
      state.setPlanStep(4);
      state.setTripType("single-city");
      state.setTripDescription("Spring city break");
      state.setRegion("europe");
      state.setDateStart("2026-04-01");
      state.setDateEnd("2026-04-10");
      state.setTravelers(3);
    });

    const state = useTripStore.getState();
    expect(state.onboardingStep).toBe(3);
    expect(state.nationality).toBe("German");
    expect(state.homeAirport).toBe("FRA");
    expect(state.travelStyle).toBe("luxury");
    expect(state.planStep).toBe(4);
    expect(state.tripType).toBe("single-city");
    expect(state.tripDescription).toBe("Spring city break");
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
      state.setGenerationStep(2);
      state.setNeedsRegeneration(true);
      state.setCurrentTripId("trip-123");
      state.setItinerary(itinerary);
    });

    const state = useTripStore.getState();
    expect(state.isGenerating).toBe(true);
    expect(state.generationStep).toBe(2);
    expect(state.needsRegeneration).toBe(true);
    expect(state.currentTripId).toBe("trip-123");
    expect(state.itinerary).toEqual(itinerary);
  });

  it("resetPlan restores plan state without changing onboarding profile defaults", () => {
    act(() => {
      const state = useTripStore.getState();
      state.setNationality("German");
      state.setHomeAirport("FRA");
      state.setTravelStyle("backpacker");
      state.setTripType("single-city");
      state.setTripDescription("Before reset");
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
    expect(state.tripType).toBe("multi-city");
    expect(state.tripDescription).toBe("");
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
