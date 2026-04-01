import { describe, it, expect } from "vitest";
import { shouldHideVisaSection, needsSchengenWarning } from "../visa-utils";
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
    expect(shouldHideVisaSection([visa("Own country"), visa("Own country")], "DE", ["DE"])).toBe(
      true
    );
  });

  it("returns true for Schengen passports traveling only within Schengen", () => {
    expect(
      shouldHideVisaSection([visa("Visa-free"), visa("Visa-free")], "DE", ["FR", "IT", "ES"])
    ).toBe(true);
  });

  it("returns false when at least one destination is outside Schengen", () => {
    expect(shouldHideVisaSection([visa("Visa-free")], "DE", ["FR", "TH"])).toBe(false);
  });

  it("returns false for non-Schengen passports even with Schengen destinations", () => {
    expect(shouldHideVisaSection([visa("Visa-free")], "US", ["FR", "IT"])).toBe(false);
  });
});

describe("needsSchengenWarning", () => {
  function schengenVisa(requirement: VisaInfo["requirement"] = "visa-free"): VisaInfo {
    return {
      country: "France",
      countryCode: "FR",
      requirement,
      maxStayDays: 90,
      notes: "",
      icon: "",
      label: "Visa-free",
      sourceUrl: "#",
      sourceLabel: "Official",
    };
  }

  it("returns false when passport is undefined", () => {
    expect(needsSchengenWarning(undefined, [schengenVisa()])).toBe(false);
  });

  it("returns false when passport is a Schengen country", () => {
    expect(needsSchengenWarning("DE", [schengenVisa()])).toBe(false);
    expect(needsSchengenWarning("FR", [schengenVisa()])).toBe(false);
  });

  it("returns true for non-Schengen passport with visa-free Schengen destination", () => {
    expect(needsSchengenWarning("US", [schengenVisa("visa-free")])).toBe(true);
    expect(needsSchengenWarning("GB", [schengenVisa("eta")])).toBe(true);
  });

  it("returns false when Schengen destination requires a visa (warning not needed)", () => {
    expect(needsSchengenWarning("PK", [schengenVisa("visa-required")])).toBe(false);
    expect(needsSchengenWarning("AF", [schengenVisa("no-admission")])).toBe(false);
  });

  it("returns true when at least one destination is Schengen even if others are not", () => {
    const nonSchengen: VisaInfo = {
      country: "Thailand",
      countryCode: "TH",
      requirement: "visa-free",
      maxStayDays: 30,
      notes: "",
      icon: "",
      label: "Visa-free",
      sourceUrl: "#",
      sourceLabel: "Official",
    };
    expect(needsSchengenWarning("US", [nonSchengen, schengenVisa()])).toBe(true);
  });

  it("returns false when all destinations are non-Schengen", () => {
    const nonSchengen: VisaInfo = {
      country: "Thailand",
      countryCode: "TH",
      requirement: "visa-free",
      maxStayDays: 30,
      notes: "",
      icon: "",
      label: "Visa-free",
      sourceUrl: "#",
      sourceLabel: "Official",
    };
    expect(needsSchengenWarning("US", [nonSchengen])).toBe(false);
  });
});
