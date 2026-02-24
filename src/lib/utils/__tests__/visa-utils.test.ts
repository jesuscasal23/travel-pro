import { describe, it, expect } from "vitest";
import { shouldHideVisaSection } from "../visa-utils";
import type { VisaInfo } from "@/types";

function visa(label: string): VisaInfo {
  return {
    country: "France",
    countryCode: "FR",
    requirement: "visa-free",
    maxStayDays: 90,
    notes: "",
    icon: "",
    label,
    sourceUrl: "#",
    sourceLabel: "Official",
  };
}

describe("shouldHideVisaSection", () => {
  it("returns false when visa data is missing", () => {
    expect(shouldHideVisaSection(undefined, "DE", ["FR"])).toBe(false);
    expect(shouldHideVisaSection([], "DE", ["FR"])).toBe(false);
  });

  it("returns true when all destinations are own country", () => {
    expect(
      shouldHideVisaSection(
        [visa("Own country"), visa("Own country")],
        "DE",
        ["DE"],
      ),
    ).toBe(true);
  });

  it("returns true for Schengen passports traveling only within Schengen", () => {
    expect(
      shouldHideVisaSection(
        [visa("Visa-free"), visa("Visa-free")],
        "DE",
        ["FR", "IT", "ES"],
      ),
    ).toBe(true);
  });

  it("returns false when at least one destination is outside Schengen", () => {
    expect(
      shouldHideVisaSection(
        [visa("Visa-free")],
        "DE",
        ["FR", "TH"],
      ),
    ).toBe(false);
  });

  it("returns false for non-Schengen passports even with Schengen destinations", () => {
    expect(
      shouldHideVisaSection(
        [visa("Visa-free")],
        "US",
        ["FR", "IT"],
      ),
    ).toBe(false);
  });
});
