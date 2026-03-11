import { describe, it, expect } from "vitest";
import { SYSTEM_PROMPT_SINGLE_CITY, assembleSingleCityPrompt } from "../prompts/single-city";
import type { UserProfile, TripIntent } from "@/types";

// ── Fixtures ────────────────────────────────────────────────────

const profile: UserProfile = {
  nationality: "German",
  homeAirport: "FRA",
  travelStyle: "smart-budget",
  interests: ["food", "culture", "photography"],
};

const singleCityIntent: TripIntent = {
  id: "test-1",
  tripType: "single-city",
  region: "",
  destination: "Barcelona",
  destinationCountry: "Spain",
  destinationCountryCode: "ES",
  destinationLat: 41.39,
  destinationLng: 2.17,
  dateStart: "2026-04-10",
  dateEnd: "2026-04-17",
  travelers: 2,
};

// ── System Prompt ───────────────────────────────────────────────

describe("SYSTEM_PROMPT_SINGLE_CITY", () => {
  it("mentions single city focus keywords", () => {
    expect(SYSTEM_PROMPT_SINGLE_CITY).toContain("neighborhoods");
    expect(SYSTEM_PROMPT_SINGLE_CITY).toContain("SINGLE city");
    expect(SYSTEM_PROMPT_SINGLE_CITY).toContain("EXACTLY ONE city stop");
  });

  it("instructs no inter-city travel", () => {
    expect(SYSTEM_PROMPT_SINGLE_CITY).toContain("isTravel");
    expect(SYSTEM_PROMPT_SINGLE_CITY).toContain("always false");
  });

  it("mentions deeper activity depth (4-5 per day)", () => {
    expect(SYSTEM_PROMPT_SINGLE_CITY).toContain("4–5 activities per day");
  });
});

// ── assembleSingleCityPrompt ────────────────────────────────────

describe("assembleSingleCityPrompt", () => {
  it("includes the destination city and country", () => {
    const prompt = assembleSingleCityPrompt(profile, singleCityIntent);
    expect(prompt).toContain("Barcelona");
    expect(prompt).toContain("Spain");
  });

  it("includes the traveler profile", () => {
    const prompt = assembleSingleCityPrompt(profile, singleCityIntent);
    expect(prompt).toContain("German");
    expect(prompt).toContain("FRA");
    expect(prompt).toContain("smart budget");
  });

  it("calculates correct trip duration", () => {
    const prompt = assembleSingleCityPrompt(profile, singleCityIntent);
    expect(prompt).toContain("7-day");
  });

  it("includes traveler count", () => {
    const prompt = assembleSingleCityPrompt(profile, singleCityIntent);
    expect(prompt).toContain("2 traveler");
  });

  it("includes coordinates in route JSON", () => {
    const prompt = assembleSingleCityPrompt(profile, singleCityIntent);
    expect(prompt).toContain("41.39");
    expect(prompt).toContain("2.17");
  });

  it("includes interests", () => {
    const prompt = assembleSingleCityPrompt(profile, singleCityIntent);
    expect(prompt).toContain("food");
    expect(prompt).toContain("culture");
    expect(prompt).toContain("photography");
  });

  it("requests day trip for 4+ day trips", () => {
    const prompt = assembleSingleCityPrompt(profile, singleCityIntent);
    expect(prompt).toContain("day trip");
  });

  it("skips day trip recommendation for short trips", () => {
    const shortIntent: TripIntent = {
      ...singleCityIntent,
      dateStart: "2026-04-10",
      dateEnd: "2026-04-13", // 3 days
    };
    const prompt = assembleSingleCityPrompt(profile, shortIntent);
    expect(prompt).toContain("city center");
    expect(prompt).not.toContain("day trips to nearby");
  });
});
