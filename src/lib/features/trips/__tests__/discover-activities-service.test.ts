// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CityStop, UserProfile } from "@/types";

const mockCity: CityStop = {
  id: "city-1",
  city: "Caracas",
  country: "Venezuela",
  countryCode: "VE",
  lat: 10.4806,
  lng: -66.9036,
  days: 3,
  iataCode: "CCS",
};

const mockProfile: UserProfile = {
  nationality: "ES",
  homeAirport: "MAD",
  travelStyle: "comfort-explorer",
  interests: ["food", "culture"],
  pace: "moderate",
};

vi.mock("@/lib/core/prisma", () => ({
  prisma: {
    discoveredActivity: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    itinerary: {
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/core/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock("../trip-query-service", () => ({
  loadTripContext: vi.fn(),
}));

vi.mock("../itinerary-service", () => ({
  findActiveItinerary: vi.fn(),
}));

vi.mock("../activity-image-service", () => ({
  resolveActivityImages: vi.fn(),
}));

vi.mock("@/lib/google-places/client", () => ({
  findPlace: vi.fn(),
}));

vi.mock("@/lib/ai/client", () => ({
  callClaude: vi.fn(),
}));

import { prisma } from "@/lib/core/prisma";
import { callClaude } from "@/lib/ai/client";
import { findPlace } from "@/lib/google-places/client";
import { loadTripContext } from "../trip-query-service";
import { findActiveItinerary } from "../itinerary-service";
import { resolveActivityImages } from "../activity-image-service";
import { discoverActivities } from "../discover-activities-service";

const mockPrisma = prisma as unknown as {
  discoveredActivity: {
    findMany: ReturnType<typeof vi.fn>;
    createMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  itinerary: {
    update: ReturnType<typeof vi.fn>;
  };
};

function makeClaudeActivity(name: string, placeName: string, latOffset: number) {
  return {
    name,
    placeName,
    venueType: "museum",
    description: `${name} description`,
    highlights: [`${name} highlight`],
    category: "culture",
    duration: "2h",
    lat: mockCity.lat + latOffset,
    lng: mockCity.lng + latOffset,
  };
}

function makeStoredActivity(index: number) {
  return {
    id: `activity-${index}`,
    cityId: mockCity.id,
    city: mockCity.city,
    name: `Stored Activity ${index}`,
    placeName: `Stored Place ${index}`,
    venueType: "museum",
    description: `Stored description ${index}`,
    highlights: [`Stored highlight ${index}`],
    category: "culture",
    duration: "2h",
    googleMapsUrl: `https://maps.google.com/?q=Stored+Activity+${index}`,
    googlePlaceId: `stored-place-${index}`,
    imageUrl: "https://images.example.com/activity.jpg",
    imageUrls: ["https://images.example.com/activity.jpg"],
    lat: mockCity.lat + 0.001 * index,
    lng: mockCity.lng + 0.001 * index,
    decision: null,
    decidedAt: null,
    assignedDay: null,
    assignedOrder: null,
    createdAt: new Date(`2026-04-04T12:${String(index).padStart(2, "0")}:00Z`),
  };
}

describe("discoverActivities", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (loadTripContext as ReturnType<typeof vi.fn>).mockResolvedValue({
      intent: {
        id: "trip-1",
        region: "south-america",
        dateStart: "2026-05-01",
        dateEnd: "2026-05-07",
        travelers: 2,
      },
    });

    (findActiveItinerary as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-1",
      discoveryStatus: "pending",
      data: { route: [mockCity], days: [] },
    });

    mockPrisma.itinerary.update.mockResolvedValue({});
    mockPrisma.discoveredActivity.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.discoveredActivity.update.mockResolvedValue({});
    mockPrisma.discoveredActivity.deleteMany.mockResolvedValue({ count: 0 });
    (resolveActivityImages as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it("drops place IDs already present on the trip before inserting replacements", async () => {
    mockPrisma.discoveredActivity.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ googlePlaceId: "place-existing" }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(
        Array.from({ length: 18 }, (_, index) => makeStoredActivity(index + 1))
      );

    (callClaude as ReturnType<typeof vi.fn>).mockResolvedValue({
      text: JSON.stringify([
        makeClaudeActivity("Historic Center Walk", "Historic Center", 0.002),
        makeClaudeActivity("Local Food Crawl", "Central Market", 0.003),
      ]),
    });

    (findPlace as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        placeId: "place-existing",
        displayName: "Historic Center",
        location: { lat: mockCity.lat + 0.002, lng: mockCity.lng + 0.002 },
      })
      .mockResolvedValueOnce({
        placeId: "place-new",
        displayName: "Central Market",
        location: { lat: mockCity.lat + 0.003, lng: mockCity.lng + 0.003 },
      });

    const result = await discoverActivities({
      tripId: "trip-1",
      profileId: "profile-1",
      profile: mockProfile,
      cityId: mockCity.id,
    });

    expect(mockPrisma.discoveredActivity.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          tripId: "trip-1",
          cityId: mockCity.id,
          name: "Local Food Crawl",
          placeName: "Central Market",
          googlePlaceId: "place-new",
        }),
      ],
      skipDuplicates: true,
    });
    expect(result.reachability.verifiedFiltered).toBe(1);
    expect(result.activities).toHaveLength(18);
  });

  it("uses skipDuplicates so concurrent inserts do not fail the request", async () => {
    mockPrisma.discoveredActivity.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(
        Array.from({ length: 18 }, (_, index) => makeStoredActivity(index + 1))
      );

    mockPrisma.discoveredActivity.createMany.mockResolvedValue({ count: 0 });

    (callClaude as ReturnType<typeof vi.fn>).mockResolvedValue({
      text: JSON.stringify([
        makeClaudeActivity("Botanical Garden Visit", "Botanical Garden", 0.002),
      ]),
    });

    (findPlace as ReturnType<typeof vi.fn>).mockResolvedValue({
      placeId: "place-race",
      displayName: "Botanical Garden",
      location: { lat: mockCity.lat + 0.002, lng: mockCity.lng + 0.002 },
    });

    const result = await discoverActivities({
      tripId: "trip-1",
      profileId: "profile-1",
      profile: mockProfile,
      cityId: mockCity.id,
    });

    expect(mockPrisma.discoveredActivity.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          name: "Botanical Garden Visit",
          googlePlaceId: "place-race",
        }),
      ],
      skipDuplicates: true,
    });
    expect(result.activities).toHaveLength(18);
  });
});
