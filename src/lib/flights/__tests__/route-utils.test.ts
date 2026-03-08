// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const originalTz = process.env.TZ;

afterEach(() => {
  process.env.TZ = originalTz;
  vi.resetModules();
  vi.doUnmock("@/lib/flights/city-iata-map");
});

describe("buildFlightLegsFromRoute", () => {
  it("keeps calendar dates stable across DST boundaries", async () => {
    process.env.TZ = "Europe/Berlin";

    vi.doMock("@/lib/flights/city-iata-map", () => ({
      lookupIata: vi.fn((city: string) => {
        if (city === "Lisbon") return "LIS";
        if (city === "Rome") return "FCO";
        return null;
      }),
    }));

    const { buildFlightLegsFromRoute } = await import("../route-utils");

    const legs = buildFlightLegsFromRoute(
      [
        {
          id: "lisbon",
          city: "Lisbon",
          country: "Portugal",
          countryCode: "PT",
          lat: 38.72,
          lng: -9.14,
          days: 1,
        },
        {
          id: "rome",
          city: "Rome",
          country: "Italy",
          countryCode: "IT",
          lat: 41.9,
          lng: 12.5,
          days: 2,
        },
      ],
      "2026-03-29",
      "2026-04-01",
      "FRA"
    );

    expect(legs).toEqual([
      { fromIata: "FRA", toIata: "LIS", departureDate: "2026-03-29" },
      { fromIata: "LIS", toIata: "FCO", departureDate: "2026-03-30" },
      { fromIata: "FCO", toIata: "FRA", departureDate: "2026-04-01" },
    ]);
  });
});
