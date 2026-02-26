import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTripStore } from "@/stores/useTripStore";
import {
  mockFramerMotion,
  mockNextLink,
  mockNavbar,
  createTestQueryWrapper,
} from "@/__tests__/mocks";

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  }),
}));

vi.mock("posthog-js/react", () => ({
  usePostHog: () => ({ capture: vi.fn() }),
}));

vi.mock("@/components/Navbar", () => mockNavbar());
vi.mock("next/link", () => mockNextLink());
vi.mock("framer-motion", () => mockFramerMotion());

vi.mock("@/components/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/ui")>();
  return {
    ...actual,
    Badge: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("span", null, children),
  };
});

import PlanPage from "@/app/plan/page";

const mockCitiesWithDays = [
  {
    id: "tokyo",
    city: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    iataCode: "NRT",
    lat: 35.68,
    lng: 139.69,
    minDays: 2,
    maxDays: 4,
  },
  {
    id: "hanoi",
    city: "Hanoi",
    country: "Vietnam",
    countryCode: "VN",
    iataCode: "HAN",
    lat: 21.03,
    lng: 105.85,
    minDays: 1,
    maxDays: 3,
  },
  {
    id: "bangkok",
    city: "Bangkok",
    country: "Thailand",
    countryCode: "TH",
    iataCode: "BKK",
    lat: 13.76,
    lng: 100.5,
    minDays: 1,
    maxDays: 3,
  },
];

// Destination is now step 1 (first step). For guests (4-step wizard),
// "Continue" appears on step 1 and "Generate" appears on step 4 (last step).
// For auth users (2-step wizard), "Continue" appears on step 1 and "Generate" on step 2.

function setMultiCityDestinationStep() {
  act(() => {
    useTripStore.setState({
      planStep: 1,
      nationality: "German",
      homeAirport: "FRA",
      travelStyle: "comfort",
      interests: [],
      tripType: "multi-city",
      region: "southeast-asia",
      destination: "",
      destinationCountry: "",
      destinationCountryCode: "",
      destinationLat: 0,
      destinationLng: 0,
      dateStart: "2026-04-01",
      dateEnd: "2026-04-22",
      travelers: 2,
      isGenerating: false,
      generationStep: 0,
      itinerary: null,
    });
  });
}

function setSingleCityDestinationStep() {
  act(() => {
    useTripStore.setState({
      planStep: 1,
      nationality: "German",
      homeAirport: "FRA",
      travelStyle: "comfort",
      interests: [],
      tripType: "single-city",
      destination: "Bangkok",
      destinationCountry: "Thailand",
      destinationCountryCode: "TH",
      destinationLat: 13.76,
      destinationLng: 100.5,
      region: "",
      dateStart: "2026-04-01",
      dateEnd: "2026-04-22",
      travelers: 2,
      isGenerating: false,
      generationStep: 0,
      itinerary: null,
    });
  });
}

function setMultiCityFinalStep() {
  act(() => {
    useTripStore.setState({
      planStep: 4,
      nationality: "German",
      homeAirport: "FRA",
      travelStyle: "comfort",
      interests: [],
      tripType: "multi-city",
      region: "southeast-asia",
      destination: "",
      destinationCountry: "",
      destinationCountryCode: "",
      destinationLat: 0,
      destinationLng: 0,
      dateStart: "2026-04-01",
      dateEnd: "2026-04-22",
      travelers: 2,
      isGenerating: false,
      generationStep: 0,
      itinerary: null,
    });
  });
}

describe("PlanPage - route review removed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows destination step first with Continue button for guests", async () => {
    setMultiCityDestinationStep();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ cities: mockCitiesWithDays }),
    }) as unknown as typeof fetch;

    render(<PlanPage />, { wrapper: createTestQueryWrapper() });

    await waitFor(() => expect(screen.getByText("Where & when?")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Generate My Itinerary/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Review your route")).not.toBeInTheDocument();
  }, 15_000);

  it("creates multi-city trip from the final step (no route review)", async () => {
    setMultiCityFinalStep();

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/generate/select-route") {
        return {
          ok: true,
          json: async () => ({ cities: mockCitiesWithDays }),
        } as Response;
      }
      if (url === "/api/v1/trips") {
        return {
          ok: true,
          status: 201,
          json: async () => ({ trip: { id: "test-trip-123" } }),
        } as Response;
      }
      throw new Error(`Unhandled fetch URL: ${url}`);
    }) as unknown as typeof fetch;

    render(<PlanPage />, { wrapper: createTestQueryWrapper() });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Generate My Itinerary/i })).toBeInTheDocument()
    );
    expect(screen.queryByText("Review your route")).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Generate My Itinerary/i }));
    });

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/trip/test-trip-123");
    });

    const storeItinerary = useTripStore.getState().itinerary;
    expect(storeItinerary).not.toBeNull();
    expect(storeItinerary?.route).toHaveLength(3);
    expect(storeItinerary?.route.map((c) => c.city)).toEqual(["Tokyo", "Hanoi", "Bangkok"]);
    expect(storeItinerary?.days).toHaveLength(0);
    expect(screen.queryByText("Review your route")).not.toBeInTheDocument();
  }, 15_000);

  it("single-city destination step shows Continue (not Generate) for guests", async () => {
    setSingleCityDestinationStep();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ trip: { id: "trip-1" } }),
    }) as unknown as typeof fetch;

    render(<PlanPage />, { wrapper: createTestQueryWrapper() });

    await waitFor(() => expect(screen.getByText("Where & when?")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Generate My Itinerary/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Review your route")).not.toBeInTheDocument();
  }, 15_000);
});
