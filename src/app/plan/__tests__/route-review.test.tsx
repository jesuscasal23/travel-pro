// ============================================================
// Integration tests for PlanPage — Route Review Step
//
// Covers:
//   - Multi-city guest flow: Details step shows "Continue" (not "Generate")
//   - Advancing from Details fetches route and shows Route Review step
//   - Route Review shows AI-suggested cities
//   - Generate on Route Review creates trip with edited cities
//   - Single-city flow: Details step shows "Generate" (no route review)
// ============================================================

import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTripStore } from "@/stores/useTripStore";
import { mockFramerMotion, mockNextLink, mockNavbar, createTestQueryWrapper } from "@/__tests__/mocks";

// ── Module mocks ──────────────────────────────────────────────────────────────

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
    Badge: ({ children }: { children?: React.ReactNode }) => React.createElement("span", null, children),
  };
});

// Mock @dnd-kit for RouteReviewStep
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => children,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: () => [],
}));
vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => children,
  sortableKeyboardCoordinates: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: vi.fn(),
  arrayMove: vi.fn(),
}));
vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => "" } },
}));

// ── Import subject after mocks ────────────────────────────────────────────────

import PlanPage from "@/app/plan/page";

// ── Mock route selection data ────────────────────────────────────────────────

const mockCitiesWithDays = [
  { id: "tokyo", city: "Tokyo", country: "Japan", countryCode: "JP", iataCode: "NRT", lat: 35.68, lng: 139.69, minDays: 2, maxDays: 4 },
  { id: "hanoi", city: "Hanoi", country: "Vietnam", countryCode: "VN", iataCode: "HAN", lat: 21.03, lng: 105.85, minDays: 1, maxDays: 3 },
  { id: "bangkok", city: "Bangkok", country: "Thailand", countryCode: "TH", iataCode: "BKK", lat: 13.76, lng: 100.5, minDays: 1, maxDays: 3 },
];

// ── Store helpers ─────────────────────────────────────────────────────────────

/** Guest on the Details step (step 4) with multi-city selected */
function setMultiCityDetailsStep() {
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
      flexibleDates: false,
      budget: 10000,
      travelers: 2,
      isGenerating: false,
      generationStep: 0,
      itinerary: null,
    });
  });
}

/** Guest on the Details step (step 4) with single-city selected */
function setSingleCityDetailsStep() {
  act(() => {
    useTripStore.setState({
      planStep: 4,
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
      flexibleDates: false,
      budget: 10000,
      travelers: 2,
      isGenerating: false,
      generationStep: 0,
      itinerary: null,
    });
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PlanPage — Route Review Step", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows 'Continue' on the Details step for multi-city trips", async () => {
    setMultiCityDetailsStep();

    // Mock speculative prefetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ cities: mockCitiesWithDays }),
    });

    render(<PlanPage />, { wrapper: createTestQueryWrapper() });

    // Details step should be visible
    await waitFor(() =>
      expect(screen.getByText("Trip details")).toBeInTheDocument()
    );

    // Should show "Continue" (not "Generate My Itinerary")
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Generate My Itinerary/i })).not.toBeInTheDocument();
  });

  it("shows 'Generate My Itinerary' on the Details step for single-city trips", async () => {
    setSingleCityDetailsStep();

    render(<PlanPage />, { wrapper: createTestQueryWrapper() });

    await waitFor(() =>
      expect(screen.getByText("Trip details")).toBeInTheDocument()
    );

    // Should show "Generate My Itinerary" (not "Continue")
    expect(screen.getByRole("button", { name: /Generate My Itinerary/i })).toBeInTheDocument();
  });

  it("advances to Route Review step after clicking Continue on Details (multi-city)", async () => {
    setMultiCityDetailsStep();

    // Mock route selection response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ cities: mockCitiesWithDays }),
    });

    render(<PlanPage />, { wrapper: createTestQueryWrapper() });

    await waitFor(() =>
      expect(screen.getByText("Trip details")).toBeInTheDocument()
    );

    // Click Continue
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    });

    // Route Review step should appear with AI-suggested cities
    await waitFor(() => {
      expect(screen.getByText("Review your route")).toBeInTheDocument();
    }, { timeout: 10_000 });

    // Cities from route selection should be displayed
    await waitFor(() => {
      expect(screen.getByText("Tokyo")).toBeInTheDocument();
      expect(screen.getByText("Hanoi")).toBeInTheDocument();
      expect(screen.getByText("Bangkok")).toBeInTheDocument();
    });

    // Generate button should be present inside the RouteReviewStep
    expect(screen.getByRole("button", { name: /Generate My Itinerary/i })).toBeInTheDocument();
  });

  it("clicking Generate on Route Review creates a trip with the cities", async () => {
    setMultiCityDetailsStep();

    // Fetch #1: speculative route selection prefetch (React Query caches the result)
    // Fetch #2: trip creation (on Generate click) — fetchQuery on Continue uses cached data
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cities: mockCitiesWithDays }) })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ trip: { id: "test-trip-123" } }),
      });

    render(<PlanPage />, { wrapper: createTestQueryWrapper() });

    await waitFor(() =>
      expect(screen.getByText("Trip details")).toBeInTheDocument()
    );

    // Advance to route review
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    });

    await waitFor(() =>
      expect(screen.getByText("Review your route")).toBeInTheDocument(),
      { timeout: 10_000 }
    );

    // Wait for cities to load
    await waitFor(() =>
      expect(screen.getByText("Tokyo")).toBeInTheDocument()
    );

    // Click Generate
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Generate My Itinerary/i }));
    });

    // Should navigate to trip page
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/trip/test-trip-123");
    });

    // Itinerary should be set in store with the route
    const storeItinerary = useTripStore.getState().itinerary;
    expect(storeItinerary).not.toBeNull();
    expect(storeItinerary!.route).toHaveLength(3);
    expect(storeItinerary!.route.map(c => c.city)).toEqual(["Tokyo", "Hanoi", "Bangkok"]);
    expect(storeItinerary!.days).toHaveLength(0); // Partial itinerary — no days yet
  });

  it("Back button on Route Review returns to Details step", async () => {
    setMultiCityDetailsStep();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ cities: mockCitiesWithDays }),
    });

    render(<PlanPage />, { wrapper: createTestQueryWrapper() });

    await waitFor(() =>
      expect(screen.getByText("Trip details")).toBeInTheDocument()
    );

    // Advance to route review
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    });

    await waitFor(() =>
      expect(screen.getByText("Review your route")).toBeInTheDocument(),
      { timeout: 10_000 }
    );

    // Click Back
    fireEvent.click(screen.getByRole("button", { name: /Back/i }));

    await waitFor(() =>
      expect(screen.getByText("Trip details")).toBeInTheDocument()
    );
  });
});
