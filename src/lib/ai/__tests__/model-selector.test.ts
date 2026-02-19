// @vitest-environment node
import { describe, it, expect } from "vitest";
import { selectModel, getMaxTokens, getTemperature, MODELS } from "../model-selector";

describe("selectModel", () => {
  it("returns Sonnet for full_itinerary", () => {
    expect(selectModel("full_itinerary")).toBe(MODELS.SONNET);
  });

  it("returns Haiku for city_activities", () => {
    expect(selectModel("city_activities")).toBe(MODELS.HAIKU);
  });

  it("returns Haiku for single_day_regen", () => {
    expect(selectModel("single_day_regen")).toBe(MODELS.HAIKU);
  });

  it("returns Haiku for budget_recalc", () => {
    expect(selectModel("budget_recalc")).toBe(MODELS.HAIKU);
  });

  it("defaults to Sonnet for unknown tasks", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(selectModel("unknown_task" as any)).toBe(MODELS.SONNET);
  });
});

describe("getMaxTokens", () => {
  it("returns 8000 for full_itinerary", () => {
    expect(getMaxTokens("full_itinerary")).toBe(8000);
  });

  it("returns 2000 for city_activities", () => {
    expect(getMaxTokens("city_activities")).toBe(2000);
  });

  it("returns 1000 for single_day_regen", () => {
    expect(getMaxTokens("single_day_regen")).toBe(1000);
  });

  it("returns 500 for budget_recalc", () => {
    expect(getMaxTokens("budget_recalc")).toBe(500);
  });

  it("defaults to 8000 for unknown tasks", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getMaxTokens("unknown" as any)).toBe(8000);
  });
});

describe("getTemperature", () => {
  it("returns 0.4 for full_itinerary", () => {
    expect(getTemperature("full_itinerary")).toBe(0.4);
  });

  it("returns 0.1 for budget_recalc (near-deterministic)", () => {
    expect(getTemperature("budget_recalc")).toBe(0.1);
  });

  it("returns 0.5 for city_activities", () => {
    expect(getTemperature("city_activities")).toBe(0.5);
  });

  it("defaults to 0.4 for unknown tasks", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getTemperature("unknown" as any)).toBe(0.4);
  });
});
