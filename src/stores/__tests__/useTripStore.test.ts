import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useTripStore } from "../useTripStore";

function resetTripStore() {
  act(() => {
    useTripStore.setState({
      nationality: "",
      homeAirport: "",
      travelStyle: null,
      interests: [],
      pace: null,
      isBuilding: false,
      needsRebuild: false,
    });
  });
}

describe("useTripStore", () => {
  beforeEach(() => {
    resetTripStore();
  });

  it("updates profile fields with dedicated setters", () => {
    act(() => {
      const state = useTripStore.getState();
      state.setNationality("German");
      state.setHomeAirport("FRA");
      state.setTravelStyle("luxury");
      state.setPace("active");
    });

    const state = useTripStore.getState();
    expect(state.nationality).toBe("German");
    expect(state.homeAirport).toBe("FRA");
    expect(state.travelStyle).toBe("luxury");
    expect(state.pace).toBe("active");
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

  it("sets build flags", () => {
    act(() => {
      const state = useTripStore.getState();
      state.setIsBuilding(true);
      state.setNeedsRebuild(true);
    });

    const state = useTripStore.getState();
    expect(state.isBuilding).toBe(true);
    expect(state.needsRebuild).toBe(true);
  });

  it("resetAll clears all fields back to defaults", () => {
    act(() => {
      const state = useTripStore.getState();
      state.setNationality("German");
      state.setHomeAirport("FRA");
      state.setTravelStyle("luxury");
      state.setIsBuilding(true);
      state.setNeedsRebuild(true);
    });

    act(() => {
      useTripStore.getState().resetAll();
    });

    const state = useTripStore.getState();
    expect(state.nationality).toBe("");
    expect(state.homeAirport).toBe("");
    expect(state.travelStyle).toBeNull();
    expect(state.isBuilding).toBe(false);
    expect(state.needsRebuild).toBe(false);
  });
});
