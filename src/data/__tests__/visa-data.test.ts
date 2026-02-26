// @vitest-environment node
// ============================================================
// Sanity / regression tests for the generated visa data files
//
// These tests import the REAL (non-mocked) data files and assert that
// known combinations are correct and the data structures are well-formed.
// If someone re-runs generate-visa-data.js and the output changes in an
// unexpected way, these tests will catch it.
// ============================================================

import { describe, it, expect } from "vitest";
import { VISA_INDEX } from "@/data/visa-index";
import { VISA_OFFICIAL_URLS } from "@/data/visa-official-urls";
import { NATIONALITY_TO_ISO2 } from "@/data/nationality-to-iso2";

// ── VISA_INDEX structure ──────────────────────────────────────────────────────

describe("VISA_INDEX — structure", () => {
  it("contains a large number of passport entries (≥ 150)", () => {
    expect(Object.keys(VISA_INDEX).length).toBeGreaterThanOrEqual(150);
  });

  it("contains standard ISO-2 passport keys: DE, US, GB, JP, AU, IN", () => {
    for (const code of ["DE", "US", "GB", "JP", "AU", "IN"]) {
      expect(VISA_INDEX).toHaveProperty(code);
    }
  });

  it("every passport entry is an object with at least 10 destination entries", () => {
    for (const passport of Object.keys(VISA_INDEX)) {
      expect(Object.keys(VISA_INDEX[passport]).length).toBeGreaterThan(10);
    }
  });

  it("all cell values are non-empty strings", () => {
    // ~39k pairs × 3 expect() calls is too slow — collect violations in a
    // single pass and assert once at the end.
    const bad: string[] = [];
    for (const [passport, dests] of Object.entries(VISA_INDEX)) {
      for (const [dest, val] of Object.entries(dests)) {
        if (typeof val !== "string" || val.length === 0 || val === "undefined") {
          bad.push(`${passport}→${dest}: ${JSON.stringify(val)}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});

// ── VISA_INDEX known values ───────────────────────────────────────────────────
// These assert specific lookup results for well-known passport+destination pairs.
// They act as a regression guard: if the upstream dataset changes, re-running
// generate-visa-data.js will update the file and these tests will flag the change.

describe("VISA_INDEX — known German passport lookups (DE)", () => {
  it("DE → JP is visa-free 90 days", () => {
    expect(VISA_INDEX["DE"]["JP"]).toBe("90");
  });

  it("DE → VN is visa-free 45 days (Vietnam extended EU visa-free to 45 days in 2023)", () => {
    expect(VISA_INDEX["DE"]["VN"]).toBe("45");
  });

  it("DE → TH is visa-free 60 days (Thailand raised limit to 60 days in 2024)", () => {
    expect(VISA_INDEX["DE"]["TH"]).toBe("60");
  });

  it("DE → DE is own-country sentinel (-1)", () => {
    expect(VISA_INDEX["DE"]["DE"]).toBe("-1");
  });
});

describe("VISA_INDEX — known US passport lookups", () => {
  it("US → JP is visa-free 90 days", () => {
    expect(VISA_INDEX["US"]["JP"]).toBe("90");
  });

  it("US → GB is eta (UK introduced mandatory ETA for US citizens in 2025)", () => {
    expect(VISA_INDEX["US"]["GB"]).toBe("eta");
  });

  it("US → US is own-country sentinel (-1)", () => {
    expect(VISA_INDEX["US"]["US"]).toBe("-1");
  });
});

describe("VISA_INDEX — known Japanese passport lookups (JP)", () => {
  it("JP → TH is visa-free 60 days (Thailand raised limit to 60 days in 2024)", () => {
    expect(VISA_INDEX["JP"]["TH"]).toBe("60");
  });

  it("JP → JP is own-country sentinel (-1)", () => {
    expect(VISA_INDEX["JP"]["JP"]).toBe("-1");
  });
});

// ── NATIONALITY_TO_ISO2 ───────────────────────────────────────────────────────

describe("NATIONALITY_TO_ISO2 — key mappings", () => {
  it("maps country names used in the onboarding dropdown", () => {
    const expected: Record<string, string> = {
      Germany: "DE",
      France: "FR",
      "United Kingdom": "GB",
      "United States": "US",
      Japan: "JP",
      Australia: "AU",
      India: "IN",
      Brazil: "BR",
      Canada: "CA",
      "South Korea": "KR",
      China: "CN",
      Singapore: "SG",
    };
    for (const [nationality, iso2] of Object.entries(expected)) {
      expect(NATIONALITY_TO_ISO2[nationality]).toBe(iso2);
    }
  });

  it("includes legacy adjective aliases for backwards-compat with persisted store", () => {
    expect(NATIONALITY_TO_ISO2["German"]).toBe("DE");
    expect(NATIONALITY_TO_ISO2["American"]).toBe("US");
    expect(NATIONALITY_TO_ISO2["British"]).toBe("GB");
    expect(NATIONALITY_TO_ISO2["French"]).toBe("FR");
    expect(NATIONALITY_TO_ISO2["Italian"]).toBe("IT");
    expect(NATIONALITY_TO_ISO2["Australian"]).toBe("AU");
  });

  it("every value is a 2-character uppercase ISO code", () => {
    for (const [key, value] of Object.entries(NATIONALITY_TO_ISO2)) {
      expect(value).toMatch(/^[A-Z]{2}$/);
      void key;
    }
  });

  it("contains a large number of entries (≥ 50)", () => {
    expect(Object.keys(NATIONALITY_TO_ISO2).length).toBeGreaterThanOrEqual(50);
  });
});

// ── VISA_OFFICIAL_URLS ────────────────────────────────────────────────────────

describe("VISA_OFFICIAL_URLS — structure and content", () => {
  it("every entry has a non-empty url and label", () => {
    for (const [code, entry] of Object.entries(VISA_OFFICIAL_URLS)) {
      expect(typeof entry.url).toBe("string");
      expect(entry.url.length).toBeGreaterThan(0);
      expect(typeof entry.label).toBe("string");
      expect(entry.label.length).toBeGreaterThan(0);
      void code;
    }
  });

  it("every url starts with https://", () => {
    for (const [code, entry] of Object.entries(VISA_OFFICIAL_URLS)) {
      expect(entry.url).toMatch(/^https:\/\//);
      void code;
    }
  });

  it("contains official URLs for all countries in the sample trip route (JP, VN, TH)", () => {
    expect(VISA_OFFICIAL_URLS["JP"].url).toContain("mofa.go.jp");
    expect(VISA_OFFICIAL_URLS["VN"].url).toContain("evisa");
    expect(VISA_OFFICIAL_URLS["TH"].url).toContain("thaievisa");
  });

  it("contains at least 20 country entries", () => {
    expect(Object.keys(VISA_OFFICIAL_URLS).length).toBeGreaterThanOrEqual(20);
  });
});

// ── Cross-file consistency ────────────────────────────────────────────────────

describe("cross-file consistency", () => {
  it("every ISO-2 code produced by NATIONALITY_TO_ISO2 exists as a key in VISA_INDEX", () => {
    const uniqueCodes = [...new Set(Object.values(NATIONALITY_TO_ISO2))];
    const missing: string[] = [];
    for (const code of uniqueCodes) {
      if (!VISA_INDEX[code]) missing.push(code);
    }
    // Allow a small number of edge-cases (e.g. XK = Kosovo, VA = Vatican City not in dataset)
    expect(missing.length).toBeLessThanOrEqual(5);
  });
});
