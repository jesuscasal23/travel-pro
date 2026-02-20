// ============================================================
// Error-handling tests for PlanPage
//
// Covers:
//   - Guest mode: stays on the plan page with an error message when
//     trip creation returns a non-200 response (no navigation)
//   - Guest mode: same behaviour when fetch throws a network error
//   - Retry clears the error and restarts generation
// ============================================================

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
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
      // Default: unauthenticated → triggers guest mode
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

// ── Import subject after mocks ────────────────────────────────────────────────

import PlanPage from "@/app/plan/page";

// ── Store setup ───────────────────────────────────────────────────────────────

/** Prime the store so the questionnaire is on the final step with valid answers.
 *  Guest mode uses a 4-step wizard (profile → style → destination → details),
 *  so the Generate button appears on step 4. */
function setValidFinalStepState() {
  act(() => {
    useTripStore.setState({
      planStep: 4,
      displayName: "Test",
      nationality: "German",
      homeAirport: "FRA",
      travelStyle: "comfort",
      interests: [],
      region: "southeast-asia",
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

// New unified flow:
// 1. Speculative route selection fires on mount (select-route fetch)
// 2. On Generate click: awaits speculative result, then creates trip via POST /api/v1/trips
// 3. If trip creation fails → error shown on plan page

describe("PlanPage — guest mode API failure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setValidFinalStepState();
  });

  it("shows an error message when trip creation returns a non-200 response", async () => {
    // Fetch #1: speculative select-route (on mount) → no cities
    // Fetch #2: POST /api/v1/trips (on Generate click) → fails
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cities: null }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    render(<PlanPage />, { wrapper: createTestQueryWrapper() });

    const generateBtn = await waitFor(() =>
      screen.getByRole("button", { name: /generate my itinerary/i })
    );

    fireEvent.click(generateBtn);

    await waitFor(() =>
      expect(
        screen.getByText(/something went wrong/i)
      ).toBeInTheDocument()
    );
  });

  it("does NOT navigate when trip creation fails", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cities: null }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    render(<PlanPage />, { wrapper: createTestQueryWrapper() });

    const generateBtn = await waitFor(() =>
      screen.getByRole("button", { name: /generate my itinerary/i })
    );

    fireEvent.click(generateBtn);

    await waitFor(() =>
      screen.getByText(/something went wrong/i)
    );

    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("shows an error message when fetch throws a network error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    render(<PlanPage />, { wrapper: createTestQueryWrapper() });

    const generateBtn = await waitFor(() =>
      screen.getByRole("button", { name: /generate my itinerary/i })
    );

    fireEvent.click(generateBtn);

    await waitFor(() =>
      expect(
        screen.getByText(/something went wrong/i)
      ).toBeInTheDocument()
    );
  });

  it("does NOT navigate when fetch throws", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    render(<PlanPage />, { wrapper: createTestQueryWrapper() });

    const generateBtn = await waitFor(() =>
      screen.getByRole("button", { name: /generate my itinerary/i })
    );

    fireEvent.click(generateBtn);

    await waitFor(() => screen.getByText(/something went wrong/i));

    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("clears the error message when the user clicks Try Again", async () => {
    // Fetch #1: speculative (mount) → no cities
    // Fetch #2: trip creation → fails → error
    // Fetch #3: retry trip creation → hangs → loading resumes
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cities: null }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockReturnValueOnce(new Promise(() => {}));

    render(<PlanPage />, { wrapper: createTestQueryWrapper() });

    const generateBtn = await waitFor(() =>
      screen.getByRole("button", { name: /generate my itinerary/i })
    );

    // First click → error appears on generation screen
    fireEvent.click(generateBtn);
    await waitFor(() => screen.getByText(/something went wrong/i));

    // User stays on generation screen — click "Try Again" to retry
    const retryBtn = screen.getByRole("button", { name: /try again/i });
    act(() => { fireEvent.click(retryBtn); });

    // Error should be cleared as generation restarts
    await waitFor(() =>
      expect(
        screen.queryByText(/something went wrong.*please try again/i)
      ).not.toBeInTheDocument()
    );
  });

  it("does not inject data into the store on failure", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cities: null }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    render(<PlanPage />, { wrapper: createTestQueryWrapper() });

    const generateBtn = await waitFor(() =>
      screen.getByRole("button", { name: /generate my itinerary/i })
    );

    fireEvent.click(generateBtn);

    await waitFor(() => screen.getByText(/something went wrong/i));

    // Store itinerary must remain null — partial itinerary only set on success
    expect(useTripStore.getState().itinerary).toBeNull();
  });
});
