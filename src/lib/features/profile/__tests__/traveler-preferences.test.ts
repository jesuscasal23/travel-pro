import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRAVELER_PREFERENCES,
  toTravelerPreferences,
  toTravelerPreferencesPatch,
  toTravelerProfile,
  toggleTravelerPreferenceInterest,
} from "../traveler-preferences";

describe("traveler-preferences", () => {
  it("normalizes persisted profile semantics into a canonical preferences object", () => {
    const preferences = toTravelerPreferences({
      nationality: "German",
      homeAirport: "FRA - Frankfurt",
      travelStyle: "luxury",
      interests: ["Food & Cuisine", "Nature & Hiking", "Photography"],
      activityLevel: "high",
      onboardingCompleted: true,
      languagesSpoken: ["German", "English"],
    });

    expect(preferences).toEqual({
      nationality: "German",
      homeAirport: "FRA - Frankfurt",
      travelStyle: "luxury",
      interests: ["food", "nature", "photography"],
      pace: "active",
      onboardingCompleted: true,
      languagesSpoken: ["German", "English"],
    });
  });

  it("builds canonical API patches", () => {
    expect(
      toTravelerPreferencesPatch({
        nationality: "German",
        interests: ["Food", "Culture"],
        pace: "relaxed",
      })
    ).toEqual({
      nationality: "German",
      interests: ["food", "culture"],
      pace: "relaxed",
    });
  });

  it("toggles normalized interests without mutating the array", () => {
    const next = toggleTravelerPreferenceInterest(["food"], "Food & Cuisine");
    const after = toggleTravelerPreferenceInterest(next, "culture");

    expect(next).toEqual([]);
    expect(after).toEqual(["culture"]);
  });

  it("projects a canonical traveler profile for AI callers", () => {
    expect(toTravelerProfile(DEFAULT_TRAVELER_PREFERENCES)).toEqual({
      nationality: "",
      homeAirport: "",
      travelStyle: "smart-budget",
      interests: [],
      pace: "moderate",
    });
  });
});
