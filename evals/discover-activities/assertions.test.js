// @vitest-environment node
import { describe, expect, it } from "vitest";

import { hasSpecificVenueNames } from "./assertions.js";

function serializeVenueNames(names) {
  return JSON.stringify(names.map((placeName) => ({ placeName })));
}

describe("hasSpecificVenueNames", () => {
  it("accepts real single-word or punctuated venue names", () => {
    const output = serializeVenueNames([
      "Berghain",
      "Watergate",
      "Tresor",
      "Montmartre",
      "Sainte-Chapelle",
      "L'Astrance",
      "RAW-Gelände",
    ]);

    expect(hasSpecificVenueNames(output)).toEqual({
      pass: true,
      score: 1,
      reason: "7/7 venue names are specific",
    });
  });

  it("rejects generic single-word venue names even when capitalized", () => {
    const output = serializeVenueNames(["Park", "Market", "Temple", "Museum", "Bar"]);

    expect(hasSpecificVenueNames(output)).toEqual({
      pass: false,
      score: 0,
      reason: "Only 0/5 specific. Generic: Park, Market, Temple",
    });
  });

  it("keeps multi-word generic patterns blocked", () => {
    const output = serializeVenueNames([
      "the local cafe",
      "A museum",
      "Some plaza",
      "Visit a market",
    ]);

    expect(hasSpecificVenueNames(output)).toEqual({
      pass: false,
      score: 0,
      reason: "Only 0/4 specific. Generic: the local cafe, A museum, Some plaza",
    });
  });
});
