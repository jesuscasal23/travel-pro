// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CityStop } from "@/types";

// Mock data modules before importing the module under test
vi.mock("@/data/visa-index", () => ({
  VISA_INDEX: {
    DE: { JP: "90", VN: "visa required", TH: "30", US: "-1" },
    US: { JP: "90", TH: "30" },
  } as Record<string, Record<string, string>>,
}));

vi.mock("@/data/visa-official-urls", () => ({
  VISA_OFFICIAL_URLS: {
    JP: { url: "https://mofa.go.jp", label: "Japan MoFA" },
    VN: { url: "https://visa.vn", label: "Vietnam Immigration" },
    TH: { url: "https://mfa.go.th", label: "Thailand MFA" },
  } as Record<string, { url: string; label: string }>,
}));

vi.mock("@/data/nationality-to-iso2", () => ({
  NATIONALITY_TO_ISO2: {
    German: "DE",
    American: "US",
  } as Record<string, string>,
}));

// Mock Redis — return null (no cache)
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
  })),
}));

import { enrichVisa, enrichWeather } from "../enrichment";

// ── Test data ────────────────────────────────────────────────

function makeStop(city: string, country: string, countryCode: string): CityStop {
  return { id: city.toLowerCase(), city, country, countryCode, lat: 35, lng: 139, days: 3 };
}

// ── enrichVisa ───────────────────────────────────────────────

describe("enrichVisa", () => {
  it("returns visa-free with days for German passport to Japan", async () => {
    const result = await enrichVisa("German", [makeStop("Tokyo", "Japan", "JP")]);
    expect(result).toHaveLength(1);
    expect(result[0].requirement).toBe("visa-free");
    expect(result[0].maxStayDays).toBe(90);
    expect(result[0].country).toBe("Japan");
    expect(result[0].sourceUrl).toBe("https://mofa.go.jp");
  });

  it("returns visa-required for German passport to Vietnam", async () => {
    const result = await enrichVisa("German", [makeStop("Hanoi", "Vietnam", "VN")]);
    expect(result).toHaveLength(1);
    expect(result[0].requirement).toBe("visa-required");
    expect(result[0].maxStayDays).toBe(0);
  });

  it("deduplicates countries in the route", async () => {
    const route = [
      makeStop("Tokyo", "Japan", "JP"),
      makeStop("Osaka", "Japan", "JP"),
      makeStop("Bangkok", "Thailand", "TH"),
    ];
    const result = await enrichVisa("German", route);
    expect(result).toHaveLength(2); // JP + TH, not 3
  });

  it("returns fallback for unknown passport nationality", async () => {
    const result = await enrichVisa("Martian", [makeStop("Tokyo", "Japan", "JP")]);
    expect(result).toHaveLength(1);
    expect(result[0].requirement).toBe("visa-required");
    expect(result[0].label).toBe("Check embassy");
  });

  it("handles 2-letter passport codes directly", async () => {
    const result = await enrichVisa("US", [makeStop("Tokyo", "Japan", "JP")]);
    expect(result).toHaveLength(1);
    expect(result[0].requirement).toBe("visa-free");
    expect(result[0].maxStayDays).toBe(90);
  });

  it("returns fallback URL for unknown destination country", async () => {
    const result = await enrichVisa("German", [makeStop("Narnia", "Narnia", "NA")]);
    expect(result).toHaveLength(1);
    expect(result[0].sourceUrl).toBe("https://www.timatic.iata.org");
  });
});

// ── enrichWeather ────────────────────────────────────────────

describe("enrichWeather", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns weather data for each city in route", async () => {
    // Mock fetch for Open-Meteo
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

    const route = [makeStop("Tokyo", "Japan", "JP"), makeStop("Bangkok", "Thailand", "TH")];
    const result = await enrichWeather(route, "2026-03-15");
    expect(result).toHaveLength(2);
    expect(result[0].city).toBe("Tokyo");
    expect(result[1].city).toBe("Bangkok");
    // Each should have temp string like "15°C"
    expect(result[0].temp).toMatch(/\d+°C/);
  });

  it("returns fallback weather on fetch failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error")) as unknown as typeof fetch;

    const result = await enrichWeather([makeStop("Tokyo", "Japan", "JP")], "2026-03-15");
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

    const result = await enrichWeather([makeStop("Tokyo", "Japan", "JP")], "invalid-date");
    expect(result).toHaveLength(1);
    expect(result[0].temp).toMatch(/\d+°C/);
  });
});
