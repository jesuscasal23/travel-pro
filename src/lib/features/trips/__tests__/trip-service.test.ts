// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
vi.mock("@/lib/core/prisma", () => ({
  prisma: {
    trip: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock("@/lib/core/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { tripToIntent } from "@/lib/features/trips/trip-intent";

beforeEach(() => {
  vi.clearAllMocks();
});

// ── tripToIntent ────────────────────────────────────────────

describe("tripToIntent", () => {
  const fullTrip = {
    id: "trip-1",
    tripType: "multi-city",
    region: "southeast-asia",
    destination: null,
    destinationCountry: null,
    destinationCountryCode: null,
    dateStart: "2026-04-01",
    dateEnd: "2026-04-22",
    flexibleDates: false,
    travelers: 2,
    description: null,
  };

  it("maps all fields correctly from a complete Trip record", () => {
    const result = tripToIntent(fullTrip);

    expect(result).toEqual({
      id: "trip-1",
      tripType: "multi-city",
      region: "southeast-asia",
      destination: undefined,
      destinationCountry: undefined,
      destinationCountryCode: undefined,
      dateStart: "2026-04-01",
      dateEnd: "2026-04-22",
      flexibleDates: false,
      travelers: 2,
    });
  });

  it("preserves non-null destination fields for single-city trips", () => {
    const singleCityTrip = {
      ...fullTrip,
      tripType: "single-city",
      destination: "Tokyo",
      destinationCountry: "Japan",
      destinationCountryCode: "JP",
    };

    const result = tripToIntent(singleCityTrip);

    expect(result.tripType).toBe("single-city");
    expect(result.destination).toBe("Tokyo");
    expect(result.destinationCountry).toBe("Japan");
    expect(result.destinationCountryCode).toBe("JP");
  });

  it("defaults tripType to multi-city when null", () => {
    const tripWithNullType = { ...fullTrip, tripType: null as unknown as string };
    const result = tripToIntent(tripWithNullType);

    expect(result.tripType).toBe("multi-city");
  });
});
