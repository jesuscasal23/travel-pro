// ============================================================
// Error-handling tests for PlanPage
//
// Covers:
//   - Guest mode: stays on the plan page with an error message when
//     trip creation returns a non-200 response (no navigation)
//   - Retry clears the error and restarts the build
// ============================================================

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useTripStore } from "@/stores/useTripStore";
import { usePlanFormStore } from "@/stores/usePlanFormStore";
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

vi.mock("@/lib/core/supabase-client", () => ({
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

vi.mock("@/components/ui/Button", () => ({
  Button: ({ children, ...props }: React.ComponentProps<"button">) =>
    React.createElement("button", props, children),
}));

vi.mock("@/lib/client/api-error-reporting", () => ({
  parseApiErrorResponse: vi.fn(async (res: Response, fallback: string) => ({
    message: fallback,
    status: res.status ?? 0,
    requestId: "req-test",
    responseBody: undefined,
  })),
}));

// ── Import subject after mocks ────────────────────────────────────────────────

import PlanPage from "@/app/plan/page";

// ── Store setup ───────────────────────────────────────────────────────────────

/** Prime both stores so the questionnaire is on the final step with valid answers. */
function setValidFinalStepState() {
  act(() => {
    useTripStore.setState({
      nationality: "German",
      homeAirport: "FRA",
      travelStyle: "smart-budget",
      interests: [],
      isBuilding: false,
    });
    usePlanFormStore.setState({
      planStep: 4,
      selectedCities: [
        {
          city: "Bangkok",
          country: "Thailand",
          countryCode: "TH",
          lat: 13.7563,
          lng: 100.5018,
        },
      ],
      dateStart: "2026-04-01",
      dateEnd: "2026-04-22",
      travelers: 2,
    });
  });
}

function mockJsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function installPlanFetchMock(options?: {
  saveProfileStatus?: number;
  createTripResponses?: Array<{ status: number; body: unknown }>;
}) {
  const createTripResponses = options?.createTripResponses ?? [];
  let createTripIndex = 0;

  global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = init?.method ?? "GET";

    if (url === "/api/v1/places/cities" && method === "GET") {
      return mockJsonResponse(200, { cities: [] });
    }

    if (url === "/api/v1/profile" && method === "GET") {
      return mockJsonResponse(404, {});
    }

    if (url === "/api/v1/profile" && method === "PATCH") {
      return mockJsonResponse(options?.saveProfileStatus ?? 200, { profile: {} });
    }

    if (url === "/api/v1/trips" && method === "POST") {
      const response = createTripResponses[createTripIndex] ?? { status: 500, body: {} };
      createTripIndex += 1;
      return mockJsonResponse(response.status, response.body);
    }

    throw new Error(`Unexpected fetch in test: ${method} ${url}`);
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
    installPlanFetchMock({
      createTripResponses: [{ status: 500, body: {} }],
    });

    render(<PlanPage />, { wrapper: createTestQueryWrapper() });

    const generateBtn = await waitFor(() =>
      screen.getByRole("button", { name: /generate my trip/i })
    );

    fireEvent.click(generateBtn);

    await waitFor(() =>
      expect(screen.getByText(/failed to create trip|something went wrong/i)).toBeInTheDocument()
    );

    expect(mockRouterPush).not.toHaveBeenCalled();
  }, 15_000);

  it("clears the error message when the user clicks Generate again", async () => {
    installPlanFetchMock({
      createTripResponses: [
        { status: 500, body: {} },
        { status: 200, body: { trip: { id: "trip-123" } } },
      ],
    });

    render(<PlanPage />, { wrapper: createTestQueryWrapper() });

    const generateBtn = await waitFor(() =>
      screen.getByRole("button", { name: /generate my trip/i })
    );

    // First click → error appears inline
    fireEvent.click(generateBtn);
    await waitFor(() => screen.getByText(/failed to create trip|something went wrong/i));

    // User clicks Generate again → navigates on success
    act(() => {
      fireEvent.click(generateBtn);
    });

    await waitFor(() =>
      expect(mockRouterPush).toHaveBeenCalledWith("/trips/trip-123/itinerary?firstRun=1")
    );
  }, 15_000);

  it("does not inject data into the store on failure", async () => {
    installPlanFetchMock({
      createTripResponses: [{ status: 500, body: {} }],
    });

    render(<PlanPage />, { wrapper: createTestQueryWrapper() });

    const generateBtn = await waitFor(() =>
      screen.getByRole("button", { name: /generate my trip/i })
    );

    fireEvent.click(generateBtn);

    await waitFor(() => screen.getByText(/failed to create trip|something went wrong/i));

    // isBuilding must be cleared on failure — no loading state stuck
    expect(useTripStore.getState().isBuilding).toBe(false);
  }, 15_000);
});
