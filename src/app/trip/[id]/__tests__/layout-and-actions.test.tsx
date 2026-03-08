import React, { Suspense } from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Itinerary } from "@/types";
import { createTestQueryWrapper } from "@/__tests__/mocks";

const mocks = vi.hoisted(() => ({
  itinerary: null as Itinerary | null,
  isMobile: true as boolean | null,
  authStatus: true as boolean | null,
  posthogCapture: vi.fn(),
  tripGeneration: {
    mutate: vi.fn(),
    reset: vi.fn(),
    error: null as Error | null,
  },
  cityActivityGeneration: {
    mutate: vi.fn(),
  },
  setItinerary: vi.fn(),
  setCurrentTripId: vi.fn(),
  setNeedsRegeneration: vi.fn(),
  mobileCtx: null as Record<string, unknown> | null,
  desktopCtx: null as Record<string, unknown> | null,
}));

vi.mock("posthog-js/react", () => ({
  usePostHog: () => ({ capture: mocks.posthogCapture }),
}));

vi.mock("@/hooks/useItinerary", () => ({
  useItinerary: () => mocks.itinerary,
}));

vi.mock("@/hooks/useIsMobile", () => ({
  useIsMobile: () => mocks.isMobile,
}));

vi.mock("@/hooks/api", () => ({
  useAuthStatus: () => mocks.authStatus,
  useTripGeneration: () => mocks.tripGeneration,
  useCityActivityGeneration: () => mocks.cityActivityGeneration,
  useVisaEnrichment: () => ({ data: undefined, isLoading: false, error: null }),
  useWeatherEnrichment: () => ({ data: undefined, isLoading: false, error: null }),
  useAccommodationEnrichment: () => ({ data: undefined, isLoading: false, error: null }),
}));

vi.mock("@/stores/useTripStore", () => {
  const useTripStore = ((
    selector?: (s: {
      nationality: string;
      homeAirport: string;
      travelStyle: string;
      interests: string[];
      dateStart: string;
      needsRegeneration: boolean;
      currentTripId: string;
      setCurrentTripId: typeof mocks.setCurrentTripId;
      setItinerary: typeof mocks.setItinerary;
      setNeedsRegeneration: typeof mocks.setNeedsRegeneration;
    }) => unknown
  ) => {
    const state = {
      nationality: "German",
      homeAirport: "FRA",
      travelStyle: "comfort",
      interests: ["culture", "food"],
      dateStart: "2026-06-01",
      needsRegeneration: true,
      currentTripId: "",
      setCurrentTripId: mocks.setCurrentTripId,
      setItinerary: mocks.setItinerary,
      setNeedsRegeneration: mocks.setNeedsRegeneration,
    };
    if (!selector) return state;
    return selector(state);
  }) as ((selector?: unknown) => unknown) & { getState: () => { itinerary: Itinerary | null } };

  useTripStore.getState = () => ({ itinerary: mocks.itinerary, currentTripId: "" });
  return { useTripStore };
});

vi.mock("@/components/trip/TripNotFound", () => ({
  TripNotFound: () => <div data-testid="trip-not-found" />,
}));

vi.mock("@/lib/utils/city-images", () => ({
  getCityHeroImage: vi.fn(() => null),
}));

// Mock MobileLayout to read from TripContext and render test buttons
vi.mock("@/components/trip/mobile/MobileLayout", async () => {
  const { useTripContext } = await vi.importActual<typeof import("@/components/trip/TripContext")>(
    "@/components/trip/TripContext"
  );
  return {
    MobileLayout: () => {
      const ctx = useTripContext();
      mocks.mobileCtx = ctx as unknown as Record<string, unknown>;
      return (
        <div data-testid="mobile-layout">
          <button onClick={ctx.onRetry}>retry</button>
          <button onClick={ctx.onRegenerate}>regenerate</button>
        </div>
      );
    },
  };
});

vi.mock("@/components/trip/desktop/DesktopLayout", async () => {
  const { useTripContext } = await vi.importActual<typeof import("@/components/trip/TripContext")>(
    "@/components/trip/TripContext"
  );
  return {
    DesktopLayout: () => {
      const ctx = useTripContext();
      mocks.desktopCtx = ctx as unknown as Record<string, unknown>;
      return <div data-testid="desktop-layout" />;
    },
  };
});

import TripPage from "@/app/trip/[id]/page";

function makeItinerary(): Itinerary {
  return {
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
}

function makePartialItinerary(): Itinerary {
  return {
    ...makeItinerary(),
    days: [],
  };
}

async function renderWithSuspense(id: string) {
  const Wrapper = createTestQueryWrapper();
  await act(async () => {
    render(
      <Wrapper>
        <Suspense fallback={<div>loading</div>}>
          <TripPage params={Promise.resolve({ id })} />
        </Suspense>
      </Wrapper>
    );
  });
}

describe("TripPage layout and action wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.itinerary = makeItinerary();
    mocks.isMobile = true;
    mocks.tripGeneration.error = null;
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);
  });

  it("renders mobile layout on mobile screens", async () => {
    mocks.isMobile = true;
    await renderWithSuspense("trip-123");
    await waitFor(() => expect(screen.getByTestId("mobile-layout")).toBeInTheDocument());
    expect(screen.queryByTestId("desktop-layout")).not.toBeInTheDocument();
  });

  it("renders desktop layout on desktop screens", async () => {
    mocks.isMobile = false;
    await renderWithSuspense("trip-123");
    await waitFor(() => expect(screen.getByTestId("desktop-layout")).toBeInTheDocument());
    expect(screen.queryByTestId("mobile-layout")).not.toBeInTheDocument();
  });

  it("shows hydration skeleton while mobile breakpoint is unresolved", async () => {
    mocks.isMobile = null;
    await renderWithSuspense("trip-123");
    expect(screen.queryByTestId("mobile-layout")).not.toBeInTheDocument();
    expect(screen.queryByTestId("desktop-layout")).not.toBeInTheDocument();
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("passes regenerate and retry handlers that reset generation state", async () => {
    await renderWithSuspense("trip-123");
    fireEvent.click(screen.getByRole("button", { name: "regenerate" }));

    expect(mocks.setNeedsRegeneration).toHaveBeenCalledWith(false);
    expect(mocks.tripGeneration.reset).toHaveBeenCalledTimes(1);
    expect(mocks.setItinerary).toHaveBeenCalledWith({
      ...mocks.itinerary,
      days: [],
      visaData: undefined,
      weatherData: undefined,
    });

    fireEvent.click(screen.getByRole("button", { name: "retry" }));
    expect(mocks.tripGeneration.mutate).toHaveBeenCalledTimes(1);
  });

  it("syncs itinerary from DB when store trip context is stale", async () => {
    const dbItinerary = makeItinerary();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        trip: {
          itineraries: [{ data: dbItinerary }],
        },
      }),
    } as Response);

    await renderWithSuspense("trip-123");

    await waitFor(() => {
      expect(mocks.setCurrentTripId).toHaveBeenCalledWith("trip-123");
      expect(mocks.setItinerary).toHaveBeenCalledWith(dbItinerary);
    });
  });

  it("starts background generation for partial itineraries and maps generation errors", async () => {
    const generated = makeItinerary();
    mocks.itinerary = makePartialItinerary();
    mocks.tripGeneration.error = new Error("Generation failed");
    mocks.tripGeneration.mutate.mockImplementation(
      (_payload: unknown, options?: { onSuccess?: (result: Itinerary) => void }) => {
        options?.onSuccess?.(generated);
      }
    );

    await renderWithSuspense("trip-123");

    await waitFor(() => expect(mocks.tripGeneration.mutate).toHaveBeenCalledTimes(1));
    const [payload] = mocks.tripGeneration.mutate.mock.calls[0] as [Record<string, unknown>];
    expect(payload).toMatchObject({
      tripId: "trip-123",
      promptVersion: "v1",
      profile: {
        nationality: "German",
        homeAirport: "FRA",
        travelStyle: "comfort",
        interests: ["culture", "food"],
      },
    });
    expect(payload.cities).toEqual([
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
    ]);
    expect(mocks.setItinerary).toHaveBeenCalledWith(generated);
    expect(mocks.mobileCtx?.generationError).toBe("Generation failed");
  });
});
