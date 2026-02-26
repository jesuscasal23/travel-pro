// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CityStop } from "@/types";

const mocks = vi.hoisted(() => ({
  upsert: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    discoveredCity: {
      upsert: (...args: unknown[]) => mocks.upsert(...args),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: mocks.info,
    warn: mocks.warn,
    error: vi.fn(),
  }),
}));

import { discoverNewCities } from "@/lib/services/city-discovery";

describe("discoverNewCities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.upsert.mockResolvedValue({});
  });

  it("skips persistence when all route cities are already known", async () => {
    const knownRoute: CityStop[] = [
      {
        id: "tokyo",
        city: "Tokyo",
        country: "Japan",
        countryCode: "JP",
        lat: 35.68,
        lng: 139.69,
        days: 3,
      },
    ];

    await discoverNewCities(knownRoute, "trip-1");

    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(mocks.info).not.toHaveBeenCalled();
  });

  it("upserts unknown cities with create payload and trip attribution", async () => {
    const unknownRoute: CityStop[] = [
      {
        id: "new-1",
        city: "Atlantis",
        country: "Ocean",
        countryCode: "OC",
        lat: 10,
        lng: 20,
        days: 2,
      },
    ];

    await discoverNewCities(unknownRoute, "trip-xyz");

    expect(mocks.info).toHaveBeenCalledTimes(1);
    expect(mocks.upsert).toHaveBeenCalledWith({
      where: {
        city_country_unique: {
          city: "Atlantis",
          countryCode: "OC",
        },
      },
      create: {
        city: "Atlantis",
        country: "Ocean",
        countryCode: "OC",
        lat: 10,
        lng: 20,
        firstTripId: "trip-xyz",
        timesProposed: 1,
      },
      update: {
        timesProposed: { increment: 1 },
      },
    });
  });

  it("continues without throwing when an upsert fails", async () => {
    const unknownRoute: CityStop[] = [
      {
        id: "new-1",
        city: "Atlantis",
        country: "Ocean",
        countryCode: "OC",
        lat: 10,
        lng: 20,
        days: 2,
      },
      {
        id: "new-2",
        city: "El Dorado",
        country: "Goldland",
        countryCode: "GL",
        lat: 11,
        lng: 21,
        days: 2,
      },
    ];

    mocks.upsert.mockRejectedValueOnce(new Error("db down")).mockResolvedValueOnce({});

    await expect(discoverNewCities(unknownRoute, "trip-err")).resolves.toBeUndefined();
    expect(mocks.warn).toHaveBeenCalledWith(
      "Failed to upsert discovered city",
      expect.objectContaining({ city: "Atlantis" })
    );
    expect(mocks.upsert).toHaveBeenCalledTimes(2);
  });
});
