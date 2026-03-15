// ============================================================
// Error-handling tests for PlanPage
//
// Covers:
//   - Guest mode: stays on the plan page with an error message when
//     trip creation returns a non-200 response (no navigation)
//   - Retry clears the error and restarts generation
// ============================================================

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useTripStore } from "@/stores/useTripStore";
import {
  mockFramerMotion,
  mockNextLink,
  mockNavbar,
  createTestQueryWrapper,
} from "@/__tests__/mocks";

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockRouterPush = vi.fn();
const mockGetUser = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
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

vi.mock("@/lib/client/api-error-reporting", () => ({
  parseApiErrorResponse: vi.fn(async (res: Response, fallback: string) => ({
    message: fallback,
    status: res.status ?? 0,
    requestId: "req-test",
    responseBody: undefined,
  })),
  reportApiError: vi.fn(async () => undefined),
}));

// ── Import subject after mocks ────────────────────────────────────────────────

import PlanPage from "@/app/plan/page";

// ── Store setup ───────────────────────────────────────────────────────────────

/** Prime the store so the questionnaire is on the final step with valid answers. */
function setValidFinalStepState() {
  act(() => {
    useTripStore.setState({
      planStep: 4,
      nationality: "German",
      homeAirport: "FRA",
      travelStyle: "smart-budget",
      interests: [],
      tripType: "single-city",
      destination: "Bangkok",
      destinationCountry: "Thailand",
      destinationCountryCode: "TH",
      destinationLat: 13.7563,
      destinationLng: 100.5018,
      region: "",
      dateStart: "2026-04-01",
      dateEnd: "2026-04-22",
      travelers: 2,
      isGenerating: false,
      itinerary: null,
    });
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

// New unified flow:
// 1. Speculative route selection fires on mount (select-route fetch)
// 2. On Generate click: awaits speculative result, then creates trip via POST /api/v1/trips
// 3. If trip creation fails → error shown on plan page

describe("PlanPage — authenticated API failure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    setValidFinalStepState();
  });

  it("shows an error message when trip creation returns a non-200 response", async () => {
    global.fetch = vi
      .fn()
      // 1. GET /api/v1/profile (after auth resolves) → 404 = no profile
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) })
      // 2. PATCH /api/v1/profile (saveProfile on generate) → ok
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ profile: {} }) })
      // 3. POST /api/v1/trips (createTrip) → 500 failure
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });

    render(<PlanPage />, { wrapper: createTestQueryWrapper() });

    // Wait for auth + profile queries to settle before interacting
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const generateBtn = await waitFor(() =>
      screen.getByRole("button", { name: /continue to generate my trip/i })
    );

    fireEvent.click(generateBtn);

    await waitFor(() =>
      expect(screen.getByText(/failed to create trip|something went wrong/i)).toBeInTheDocument()
    );

    expect(mockRouterPush).not.toHaveBeenCalled();
  }, 15_000);

  it("clears the error message when the user clicks Generate again", async () => {
    global.fetch = vi
      .fn()
      // 1. GET /api/v1/profile → 404
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) })
      // 2. PATCH /api/v1/profile (1st generate) → ok
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ profile: {} }) })
      // 3. POST /api/v1/trips (1st generate) → 500 failure
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
      // 4. PATCH /api/v1/profile (2nd generate) → ok
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ profile: {} }) })
      // 5. POST /api/v1/trips (2nd generate) → success
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ trip: { id: "trip-123" } }),
      });

    render(<PlanPage />, { wrapper: createTestQueryWrapper() });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const generateBtn = await waitFor(() =>
      screen.getByRole("button", { name: /continue to generate my trip/i })
    );

    // First click → error appears inline
    fireEvent.click(generateBtn);
    await waitFor(() => screen.getByText(/failed to create trip|something went wrong/i));

    // User clicks Generate again → navigates on success
    act(() => {
      fireEvent.click(generateBtn);
    });

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/trips/trip-123"));
  }, 15_000);

  it("does not inject data into the store on failure", async () => {
    global.fetch = vi
      .fn()
      // 1. GET /api/v1/profile → 404
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) })
      // 2. PATCH /api/v1/profile → ok
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ profile: {} }) })
      // 3. POST /api/v1/trips → 500 failure
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });

    render(<PlanPage />, { wrapper: createTestQueryWrapper() });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const generateBtn = await waitFor(() =>
      screen.getByRole("button", { name: /continue to generate my trip/i })
    );

    fireEvent.click(generateBtn);

    await waitFor(() => screen.getByText(/failed to create trip|something went wrong/i));

    // Store itinerary must remain null — partial itinerary only set on success
    expect(useTripStore.getState().itinerary).toBeNull();
  }, 15_000);
});
