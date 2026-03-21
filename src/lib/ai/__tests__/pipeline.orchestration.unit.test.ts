// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Itinerary, TripIntent, UserProfile } from "@/types";

const mocks = vi.hoisted(() => ({
  createMessage: vi.fn(),
  assemblePrompt: vi.fn(() => "assembled-v1"),
  assembleSingleCityPrompt: vi.fn(() => "assembled-single"),
  assembleRouteOnlyPrompt: vi.fn(() => "assembled-route-only"),
  assembleRouteOnlySingleCityPrompt: vi.fn(() => "assembled-route-only-single"),
  assembleCityActivitiesPrompt: vi.fn(() => "assembled-city-activities"),
  selectRoute: vi.fn(),
  enrichVisa: vi.fn(),
  enrichWeather: vi.fn(),
  discoverNewCities: vi.fn(),
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  prismaFindFirst: vi.fn(),
  prismaUpdate: vi.fn(),
  prismaCreate: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class Anthropic {
    messages = {
      create: mocks.createMessage,
    };
  },
}));

vi.mock("@/lib/config/server-env", () => ({
  getAnthropicApiKey: () => "test-key",
}));

vi.mock("../prompts/v1", () => ({
  SYSTEM_PROMPT_V1: "system-v1",
  assemblePrompt: mocks.assemblePrompt,
}));

vi.mock("../prompts/single-city", () => ({
  SYSTEM_PROMPT_SINGLE_CITY: "system-single",
  assembleSingleCityPrompt: mocks.assembleSingleCityPrompt,
}));

vi.mock("../prompts/route-only", () => ({
  SYSTEM_PROMPT_ROUTE_ONLY: "system-route-only",
  SYSTEM_PROMPT_ROUTE_ONLY_SINGLE_CITY: "system-route-only-single",
  assembleRouteOnlyPrompt: mocks.assembleRouteOnlyPrompt,
  assembleRouteOnlySingleCityPrompt: mocks.assembleRouteOnlySingleCityPrompt,
}));

vi.mock("../prompts/city-activities", () => ({
  SYSTEM_PROMPT_CITY_ACTIVITIES: "system-city-activities",
  assembleCityActivitiesPrompt: mocks.assembleCityActivitiesPrompt,
}));

vi.mock("../prompts/route-selector", () => ({
  selectRoute: mocks.selectRoute,
}));

vi.mock("../enrich-visa", () => ({
  enrichVisa: mocks.enrichVisa,
}));

vi.mock("../enrich-weather", () => ({
  enrichWeather: mocks.enrichWeather,
}));

vi.mock("@/lib/features/generation/city-discovery", () => ({
  discoverNewCities: mocks.discoverNewCities,
}));

vi.mock("@/lib/core/logger", () => ({
  createLogger: () => mocks.logger,
}));

vi.mock("@/lib/core/prisma", () => ({
  getPrisma: () => ({
    itinerary: {
      findFirst: mocks.prismaFindFirst,
      update: mocks.prismaUpdate,
      create: mocks.prismaCreate,
    },
  }),
}));

import {
  generateCoreItinerary,
  generateRouteOnly,
  generateCityActivities,
  generateItinerary,
} from "@/lib/ai/pipeline";

const profile: UserProfile = {
  nationality: "German",
  homeAirport: "FRA",
  travelStyle: "smart-budget",
  interests: ["culture", "food"],
};

const multiCityIntent: TripIntent = {
  id: "trip-1",
  tripType: "multi-city",
  region: "europe",
  dateStart: "2026-06-01",
  dateEnd: "2026-06-10",
  travelers: 2,
};

const singleCityIntent: TripIntent = {
  id: "trip-2",
  tripType: "single-city",
  region: "",
  destination: "Paris",
  destinationCountry: "France",
  dateStart: "2026-06-01",
  dateEnd: "2026-06-05",
  travelers: 2,
};

const coreItinerary: Itinerary = {
  route: [
    {
      id: "paris",
      city: "Paris",
      country: "France",
      countryCode: "FR",
      lat: 48.85,
      lng: 2.35,
      days: 2,
      iataCode: "CDG",
    },
  ],
  days: [
    {
      day: 1,
      date: "2026-06-01",
      city: "Paris",
      activities: [{ name: "Louvre", category: "Culture", why: "Art", duration: "2h" }],
    },
  ],
};

function mockClaudeText(text: string, stopReason = "end_turn") {
  mocks.createMessage.mockResolvedValue({
    content: [{ type: "text", text }],
    usage: { input_tokens: 100, output_tokens: 200 },
    model: "claude-haiku-4-5-20251001",
    stop_reason: stopReason,
  });
}

describe("pipeline orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClaudeText(JSON.stringify(coreItinerary));
    mocks.enrichVisa.mockResolvedValue([{ country: "France" }]);
    mocks.enrichWeather.mockResolvedValue([{ city: "Paris" }]);
    mocks.discoverNewCities.mockResolvedValue(undefined);
    mocks.prismaFindFirst.mockResolvedValue({ id: "itin-1" });
    mocks.prismaUpdate.mockResolvedValue({});
    mocks.prismaCreate.mockResolvedValue({});
  });

  it("generates core itinerary with pre-selected cities without route selection", async () => {
    const preSelected = [
      {
        id: "paris",
        city: "Paris",
        country: "France",
        countryCode: "FR",
        iataCode: "CDG",
        lat: 48.85,
        lng: 2.35,
        minDays: 2,
        maxDays: 2,
      },
    ];

    const result = await generateCoreItinerary(profile, multiCityIntent, preSelected);

    expect(mocks.selectRoute).not.toHaveBeenCalled();
    expect(mocks.assemblePrompt).toHaveBeenCalledWith(
      profile,
      multiCityIntent,
      undefined,
      preSelected
    );
    expect(mocks.discoverNewCities).toHaveBeenCalledWith(result.route, "trip-1");
    expect(result.route[0].city).toBe("Paris");
  });

  it("falls back to Claude-only route generation when route selection fails", async () => {
    mocks.selectRoute.mockRejectedValueOnce(new Error("route selection failed"));

    const result = await generateCoreItinerary(profile, multiCityIntent);

    expect(mocks.selectRoute).toHaveBeenCalledTimes(1);
    expect(mocks.assemblePrompt).toHaveBeenCalledWith(
      profile,
      multiCityIntent,
      undefined,
      undefined
    );
    expect(result.days).toHaveLength(1);
  });

  it("uses single-city prompt path for single-city core generation", async () => {
    await generateCoreItinerary(profile, singleCityIntent);

    expect(mocks.assembleSingleCityPrompt).toHaveBeenCalledWith(profile, singleCityIntent);
    expect(mocks.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        system: "system-single",
        max_tokens: 8000,
      }),
      { signal: undefined }
    );
  });

  it("generates route-only itinerary with single-city route-only prompt", async () => {
    const routeOnly: Itinerary = {
      ...coreItinerary,
      days: [{ day: 1, date: "2026-06-01", city: "Paris", activities: [] }],
    };
    mockClaudeText(JSON.stringify(routeOnly));

    const result = await generateRouteOnly(profile, singleCityIntent);

    expect(mocks.assembleRouteOnlySingleCityPrompt).toHaveBeenCalledWith(profile, singleCityIntent);
    expect(mocks.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        system: "system-route-only-single",
        max_tokens: 4000,
      }),
      { signal: undefined }
    );
    expect(result.days[0].activities).toHaveLength(0);
  });

  it("validates city activity generation guard rails and success path", async () => {
    await expect(
      generateCityActivities(profile, multiCityIntent, coreItinerary, "unknown")
    ).rejects.toThrow(/not found in itinerary route/i);

    const noDaysForCity: Itinerary = {
      ...coreItinerary,
      route: [
        ...coreItinerary.route,
        {
          id: "rome",
          city: "Rome",
          country: "Italy",
          countryCode: "IT",
          lat: 41.9,
          lng: 12.49,
          days: 2,
        },
      ],
    };
    await expect(
      generateCityActivities(profile, multiCityIntent, noDaysForCity, "rome")
    ).rejects.toThrow(/No days found for city "Rome"/);

    mockClaudeText(
      JSON.stringify({
        days: [
          {
            day: 1,
            date: "2026-06-01",
            city: "Paris",
            activities: [{ name: "Cafe", category: "Food", why: "Local", duration: "1h" }],
          },
        ],
      })
    );
    const days = await generateCityActivities(profile, multiCityIntent, coreItinerary, "paris");
    expect(days).toHaveLength(1);
    expect(days[0].activities[0].name).toBe("Cafe");
  });

  it("runs full itinerary generation with enrichment and persists to existing record", async () => {
    const result = await generateItinerary(profile, multiCityIntent);

    expect(mocks.enrichVisa).toHaveBeenCalledWith("German", coreItinerary.route);
    expect(mocks.enrichWeather).toHaveBeenCalledWith(
      coreItinerary.route,
      multiCityIntent.dateStart
    );
    expect(mocks.prismaFindFirst).toHaveBeenCalledWith({
      where: { tripId: "trip-1", isActive: true },
    });
    expect(mocks.prismaUpdate).toHaveBeenCalledTimes(1);
    expect(result.visaData).toEqual([{ country: "France" }]);
    expect(result.weatherData).toEqual([{ city: "Paris" }]);
  });
});
