// @vitest-environment node
// ============================================================
// Unit tests for enrichVisa()
//
// Covers:
//   parseRequirement — every cell value in the Passport Index dataset
//   enrichVisa       — nationality resolution, deduplication, source URLs,
//                      and all fallback scenarios
//
// The three data files (VISA_INDEX, VISA_OFFICIAL_URLS, NATIONALITY_TO_ISO2)
// are mocked so tests are deterministic and don't depend on the generated file.
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock data files before any module-under-test is imported ─────────────────

vi.mock("@/data/visa-index", () => ({
  VISA_INDEX: {
    DE: {
      JP: "90",              // visa-free, 90 days
      VN: "e-visa",          // e-visa
      TH: "30",              // visa-free, 30 days
      DE: "-1",              // own country
      KP: "no admission",    // no admission
      MM: "visa on arrival", // visa on arrival
      AU: "eta",             // ETA required
      US: "visa free",       // visa-free, days unspecified
      GB: "180",             // visa-free, 180 days (Schengen)
    },
    US: {
      IN: "e-visa",
      GB: "180",
      JP: "90",
    },
    NG: {
      GB: "visa required",
      US: "visa required",
    },
  },
}));

vi.mock("@/data/visa-official-urls", () => ({
  VISA_OFFICIAL_URLS: {
    JP: { url: "https://www.mofa.go.jp/j_info/visit/visa/index.html", label: "Japan MOFA" },
    VN: { url: "https://evisa.xuatnhapcanh.gov.vn", label: "Vietnam Official E-Visa Portal" },
    TH: { url: "https://www.thaievisa.go.th", label: "Thailand e-Visa" },
    IN: { url: "https://indianvisaonline.gov.in/evisa/tvoa.html", label: "India e-Visa" },
    GB: { url: "https://www.gov.uk/check-uk-visa", label: "UK Visa Check" },
    AU: { url: "https://immi.homeaffairs.gov.au/visas", label: "Australia Home Affairs" },
    US: { url: "https://travel.state.gov/content/travel/en/us-visas.html", label: "US State Dept" },
    // KP and MM deliberately absent to test IATA Timatic fallback
  },
}));

// Mock Redis — return null (no cache) for enrichWeather tests
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
  })),
}));

vi.mock("@/data/nationality-to-iso2", () => ({
  NATIONALITY_TO_ISO2: {
    // Country name format (from nationalities.ts)
    "Germany": "DE",
    "United States": "US",
    "Nigeria": "NG",
    "Japan": "JP",
    // Legacy adjective format (backwards-compat with persisted store)
    "German": "DE",
    "American": "US",
  },
}));

import { enrichVisa, enrichWeather } from "@/lib/ai/enrichment";
import type { CityStop } from "@/types";

// ── Fixture helper ────────────────────────────────────────────────────────────

function stop(countryCode: string, country: string): CityStop {
  return { id: countryCode.toLowerCase(), city: `Test City`, country, lat: 0, lng: 0, days: 3, countryCode };
}

// ── parseRequirement — all cell value types ───────────────────────────────────

describe("enrichVisa — parseRequirement via real lookups", () => {
  it("numeric cell value → visa-free with correct day count and label", async () => {
    const result = await enrichVisa("Germany", [stop("JP", "Japan")]);
    expect(result).toHaveLength(1);
    expect(result[0].requirement).toBe("visa-free");
    expect(result[0].maxStayDays).toBe(90);
    expect(result[0].label).toBe("Visa-free (90 days)");
    expect(result[0].icon).toBe("✅");
    expect(result[0].notes).toContain("90 days");
  });

  it("'e-visa' cell value → e-visa requirement", async () => {
    const result = await enrichVisa("Germany", [stop("VN", "Vietnam")]);
    expect(result[0].requirement).toBe("e-visa");
    expect(result[0].icon).toBe("💻");
    expect(result[0].label).toBe("E-visa required");
  });

  it("smaller numeric value (30) → visa-free with correct day count", async () => {
    const result = await enrichVisa("Germany", [stop("TH", "Thailand")]);
    expect(result[0].requirement).toBe("visa-free");
    expect(result[0].maxStayDays).toBe(30);
    expect(result[0].label).toBe("Visa-free (30 days)");
  });

  it("'-1' cell value → own country / visa-free 365 days", async () => {
    const result = await enrichVisa("Germany", [stop("DE", "Germany")]);
    expect(result[0].requirement).toBe("visa-free");
    expect(result[0].maxStayDays).toBe(365);
    expect(result[0].label).toBe("Own country");
    expect(result[0].icon).toBe("🏠");
  });

  it("'no admission' cell value → no-admission requirement", async () => {
    const result = await enrichVisa("Germany", [stop("KP", "North Korea")]);
    expect(result[0].requirement).toBe("no-admission");
    expect(result[0].maxStayDays).toBe(0);
    expect(result[0].icon).toBe("🚫");
    expect(result[0].label).toBe("No admission");
  });

  it("'visa on arrival' cell value → visa-on-arrival requirement", async () => {
    const result = await enrichVisa("Germany", [stop("MM", "Myanmar")]);
    expect(result[0].requirement).toBe("visa-on-arrival");
    expect(result[0].icon).toBe("🛬");
    expect(result[0].label).toBe("Visa on arrival");
    expect(result[0].notes).toContain("onward travel");
  });

  it("'eta' cell value → eta requirement", async () => {
    const result = await enrichVisa("Germany", [stop("AU", "Australia")]);
    expect(result[0].requirement).toBe("eta");
    expect(result[0].icon).toBe("📱");
    expect(result[0].label).toBe("ETA required");
  });

  it("'visa free' (text, no days) → visa-free with maxStayDays 0", async () => {
    const result = await enrichVisa("Germany", [stop("US", "United States")]);
    expect(result[0].requirement).toBe("visa-free");
    expect(result[0].maxStayDays).toBe(0);
    expect(result[0].label).toBe("Visa-free");
  });

  it("'visa required' cell value → visa-required requirement", async () => {
    const result = await enrichVisa("Nigeria", [stop("GB", "United Kingdom")]);
    expect(result[0].requirement).toBe("visa-required");
    expect(result[0].icon).toBe("🛂");
    expect(result[0].label).toBe("Visa required");
    expect(result[0].notes).toContain("embassy");
  });

  it("larger numeric value (180) → visa-free with correct day count", async () => {
    const result = await enrichVisa("Germany", [stop("GB", "United Kingdom")]);
    expect(result[0].requirement).toBe("visa-free");
    expect(result[0].maxStayDays).toBe(180);
    expect(result[0].label).toBe("Visa-free (180 days)");
  });
});

// ── Nationality resolution ────────────────────────────────────────────────────

describe("enrichVisa — nationality resolution", () => {
  it("resolves country name ('Germany') to ISO-2 and looks up data", async () => {
    const result = await enrichVisa("Germany", [stop("JP", "Japan")]);
    expect(result[0].requirement).toBe("visa-free");
    expect(result[0].maxStayDays).toBe(90);
  });

  it("resolves legacy adjective ('German') to ISO-2 — backwards-compat with persisted store", async () => {
    const result = await enrichVisa("German", [stop("JP", "Japan")]);
    expect(result[0].requirement).toBe("visa-free");
    expect(result[0].maxStayDays).toBe(90);
  });

  it("accepts a bare ISO-2 code ('DE') directly as passportCountry", async () => {
    const result = await enrichVisa("DE", [stop("JP", "Japan")]);
    expect(result[0].requirement).toBe("visa-free");
    expect(result[0].maxStayDays).toBe(90);
  });

  it("resolves 'United States' to US and returns correct data", async () => {
    const result = await enrichVisa("United States", [stop("IN", "India")]);
    expect(result[0].requirement).toBe("e-visa");
  });

  it("resolves legacy 'American' to US", async () => {
    const result = await enrichVisa("American", [stop("IN", "India")]);
    expect(result[0].requirement).toBe("e-visa");
  });
});

// ── Source URLs ───────────────────────────────────────────────────────────────

describe("enrichVisa — source URLs", () => {
  it("attaches the official government URL for a known destination", async () => {
    const result = await enrichVisa("Germany", [stop("JP", "Japan")]);
    expect(result[0].sourceUrl).toBe("https://www.mofa.go.jp/j_info/visit/visa/index.html");
    expect(result[0].sourceLabel).toBe("Japan MOFA");
  });

  it("attaches the e-visa portal URL for Vietnam", async () => {
    const result = await enrichVisa("Germany", [stop("VN", "Vietnam")]);
    expect(result[0].sourceUrl).toBe("https://evisa.xuatnhapcanh.gov.vn");
    expect(result[0].sourceLabel).toBe("Vietnam Official E-Visa Portal");
  });

  it("falls back to IATA Timatic for destinations not in VISA_OFFICIAL_URLS", async () => {
    // KP (North Korea) is not in the mocked VISA_OFFICIAL_URLS
    const result = await enrichVisa("Germany", [stop("KP", "North Korea")]);
    expect(result[0].sourceUrl).toBe("https://www.timatic.iata.org");
    expect(result[0].sourceLabel).toBe("IATA Timatic");
  });
});

// ── Deduplication ─────────────────────────────────────────────────────────────

describe("enrichVisa — deduplication", () => {
  it("returns one entry per unique country even when the same country appears multiple times", async () => {
    const route = [
      stop("JP", "Japan"),
      stop("JP", "Japan"), // duplicate
      stop("VN", "Vietnam"),
    ];
    const result = await enrichVisa("Germany", route);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.countryCode)).toEqual(["JP", "VN"]);
  });

  it("preserves insertion order across deduplicated stops", async () => {
    const route = [stop("VN", "Vietnam"), stop("JP", "Japan"), stop("TH", "Thailand"), stop("JP", "Japan")];
    const result = await enrichVisa("Germany", route);
    expect(result).toHaveLength(3);
    expect(result[0].countryCode).toBe("VN");
    expect(result[1].countryCode).toBe("JP");
    expect(result[2].countryCode).toBe("TH");
  });

  it("handles a single-country route correctly", async () => {
    const result = await enrichVisa("Germany", [stop("JP", "Japan")]);
    expect(result).toHaveLength(1);
    expect(result[0].country).toBe("Japan");
    expect(result[0].countryCode).toBe("JP");
  });

  it("returns an empty array for an empty route", async () => {
    const result = await enrichVisa("Germany", []);
    expect(result).toHaveLength(0);
  });
});

// ── Fallback scenarios ────────────────────────────────────────────────────────

describe("enrichVisa — fallback scenarios", () => {
  it("returns generic fallback when nationality is not in mapping and is not a 2-char code", async () => {
    const result = await enrichVisa("Klingon", [stop("JP", "Japan")]);
    expect(result[0].requirement).toBe("visa-required");
    expect(result[0].label).toBe("Check embassy");
    expect(result[0].notes).toContain("don't have data");
    // Official URL still applied even on fallback
    expect(result[0].sourceUrl).toBe("https://www.mofa.go.jp/j_info/visit/visa/index.html");
  });

  it("returns generic fallback when passport code exists in mapping but has no entry for the destination", async () => {
    // NG is in the mock, but NG has no entry for JP
    const result = await enrichVisa("Nigeria", [stop("JP", "Japan")]);
    expect(result[0].requirement).toBe("visa-required");
    expect(result[0].label).toBe("Check embassy");
  });

  it("returns IATA Timatic URL on the fallback when destination has no official URL", async () => {
    // "Klingon" → no ISO2 → generic fallback; KP has no official URL in mock
    const result = await enrichVisa("Klingon", [stop("KP", "North Korea")]);
    expect(result[0].sourceUrl).toBe("https://www.timatic.iata.org");
    expect(result[0].sourceLabel).toBe("IATA Timatic");
  });

  it("a 2-char uppercase string not in NATIONALITY_TO_ISO2 is tried directly as ISO-2", async () => {
    // "DE" is not in NATIONALITY_TO_ISO2 mock but is 2 chars → used directly
    const result = await enrichVisa("DE", [stop("TH", "Thailand")]);
    expect(result[0].requirement).toBe("visa-free");
    expect(result[0].maxStayDays).toBe(30);
  });

  it("a 2-char lowercase string is upper-cased and tried as ISO-2", async () => {
    const result = await enrichVisa("de", [stop("TH", "Thailand")]);
    expect(result[0].requirement).toBe("visa-free");
    expect(result[0].maxStayDays).toBe(30);
  });
});

// ── Result shape ──────────────────────────────────────────────────────────────

describe("enrichVisa — result shape", () => {
  it("every result has all required VisaInfo fields", async () => {
    const route = [stop("JP", "Japan"), stop("VN", "Vietnam"), stop("TH", "Thailand")];
    const results = await enrichVisa("Germany", route);
    for (const visa of results) {
      expect(visa).toHaveProperty("country");
      expect(visa).toHaveProperty("countryCode");
      expect(visa).toHaveProperty("requirement");
      expect(visa).toHaveProperty("maxStayDays");
      expect(visa).toHaveProperty("notes");
      expect(visa).toHaveProperty("icon");
      expect(visa).toHaveProperty("label");
      expect(visa).toHaveProperty("sourceUrl");
      expect(visa).toHaveProperty("sourceLabel");
    }
  });

  it("countryCode in the result matches the stop's countryCode", async () => {
    const result = await enrichVisa("Germany", [stop("VN", "Vietnam")]);
    expect(result[0].countryCode).toBe("VN");
  });

  it("country name in result matches the stop's country field", async () => {
    const result = await enrichVisa("Germany", [stop("VN", "Vietnam")]);
    expect(result[0].country).toBe("Vietnam");
  });
});

// ── enrichWeather ────────────────────────────────────────────────────────────

describe("enrichWeather", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns weather data for each city in route", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          daily: {
            time: ["2025-03-01"],
            temperature_2m_max: [20],
            temperature_2m_min: [10],
            precipitation_sum: [2],
          },
        }),
    }) as unknown as typeof fetch;

    const route = [stop("JP", "Japan"), stop("TH", "Thailand")];
    const result = await enrichWeather(route, "2026-03-15");
    expect(result).toHaveLength(2);
    expect(result[0].city).toBe("Test City");
    expect(result[1].city).toBe("Test City");
    expect(result[0].temp).toMatch(/\d+°C/);
  });

  it("returns fallback weather on fetch failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error")) as unknown as typeof fetch;

    const result = await enrichWeather([stop("JP", "Japan")], "2026-03-15");
    expect(result).toHaveLength(1);
    expect(result[0].temp).toBe("25°C");
    expect(result[0].condition).toBe("Warm");
  });

  it("defaults to October when dateStart is invalid", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          daily: {
            time: ["2025-10-01"],
            temperature_2m_max: [28],
            temperature_2m_min: [22],
            precipitation_sum: [3],
          },
        }),
    }) as unknown as typeof fetch;

    const result = await enrichWeather([stop("JP", "Japan")], "invalid-date");
    expect(result).toHaveLength(1);
    expect(result[0].temp).toMatch(/\d+°C/);
  });
});
