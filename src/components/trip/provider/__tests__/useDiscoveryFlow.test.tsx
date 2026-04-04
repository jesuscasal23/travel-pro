import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { Itinerary, TravelStyle } from "@/types";
import { useDiscoveryFlow } from "../useDiscoveryFlow";

const discoverActivitiesState = {
  mutateAsync: vi.fn(),
  isPending: false,
};

const recordActivitySwipeState = {
  mutate: vi.fn(),
};

vi.mock("@/hooks/api", () => ({
  useDiscoverActivities: () => discoverActivitiesState,
  useRecordActivitySwipe: () => recordActivitySwipeState,
  useActivityImages: () => new Map(),
}));

function makeItinerary(): Itinerary {
  return {
    route: [
      {
        id: "city-1",
        city: "Caracas",
        country: "Venezuela",
        countryCode: "VE",
        lat: 10.48,
        lng: -66.9,
        days: 3,
      },
    ],
    days: [],
  };
}

function makeProfile() {
  return {
    nationality: "DE",
    homeAirport: "BER",
    travelStyle: "smart-budget" as TravelStyle,
    interests: ["food", "culture"],
  };
}

describe("useDiscoveryFlow", () => {
  beforeEach(() => {
    discoverActivitiesState.mutateAsync.mockReset();
    discoverActivitiesState.isPending = false;
    recordActivitySwipeState.mutate.mockReset();
  });

  it("does not reissue the same auto-discovery request across rerenders", async () => {
    discoverActivitiesState.mutateAsync.mockReturnValue(new Promise(() => undefined));

    const itinerary = makeItinerary();
    const { rerender } = renderHook(
      ({ requestProfile }) =>
        useDiscoveryFlow({
          tripId: "trip-1",
          itinerary,
          serverDiscoveryStatus: "pending",
          hasDiscoveryProfile: true,
          requestProfile,
          isGuest: false,
        }),
      {
        initialProps: { requestProfile: makeProfile() },
      }
    );

    await waitFor(() => {
      expect(discoverActivitiesState.mutateAsync).toHaveBeenCalledTimes(1);
    });

    rerender({ requestProfile: makeProfile() });

    await waitFor(() => {
      expect(discoverActivitiesState.mutateAsync).toHaveBeenCalledTimes(1);
    });
  });
});
