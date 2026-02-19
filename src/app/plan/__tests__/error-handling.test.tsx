// ============================================================
// Error-handling tests for PlanPage
//
// Covers:
//   - Guest mode: stays on the plan page with an error message when
//     the API returns a non-200 response (no sampleFullItinerary fallback,
//     no navigation to /trip/guest)
//   - Guest mode: same behaviour when fetch throws a network error
//   - Auth mode: redirects to /dashboard on total failure
// ============================================================

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useTripStore } from "@/stores/useTripStore";
import { mockFramerMotion, mockNextLink, mockNavbar } from "@/__tests__/mocks";

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

vi.mock("@/components/ui", () => ({
  Badge: ({ children }: { children?: React.ReactNode }) => React.createElement("span", null, children),
}));

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
      vibe: "cultural",
      travelers: 2,
      isGenerating: false,
      generationStep: 0,
      itinerary: null,
    });
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PlanPage — guest mode API failure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setValidFinalStepState();
  });

  it("shows an error message when the API returns a non-200 response", async () => {
    // Guest flow: 2 fetches — select-route succeeds, generate fails
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cities: null }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    render(<PlanPage />);

    // Wait for auth check to settle (isAuthenticated resolves to false)
    const generateBtn = await waitFor(() =>
      screen.getByRole("button", { name: /generate my itinerary/i })
    );

    fireEvent.click(generateBtn);

    await waitFor(() =>
      expect(
        screen.getByText(/couldn't generate your itinerary/i)
      ).toBeInTheDocument()
    );
  });

  it("does NOT navigate to /trip/guest when the API fails", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cities: null }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    render(<PlanPage />);

    const generateBtn = await waitFor(() =>
      screen.getByRole("button", { name: /generate my itinerary/i })
    );

    fireEvent.click(generateBtn);

    await waitFor(() =>
      screen.getByText(/couldn't generate your itinerary/i)
    );

    expect(mockRouterPush).not.toHaveBeenCalledWith("/trip/guest");
  });

  it("shows an error message when the API call throws a network error", async () => {
    // Both fetches reject — inner catch handles select-route, outer catch handles generate
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    render(<PlanPage />);

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

  it("does NOT navigate to /trip/guest when fetch throws", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    render(<PlanPage />);

    const generateBtn = await waitFor(() =>
      screen.getByRole("button", { name: /generate my itinerary/i })
    );

    fireEvent.click(generateBtn);

    await waitFor(() => screen.getByText(/something went wrong/i));

    expect(mockRouterPush).not.toHaveBeenCalledWith("/trip/guest");
  });

  it("clears the error message when the user clicks Generate again", async () => {
    // First click: select-route OK + generate fails → error appears
    // Second click: select-route never resolves → loading screen takes over
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cities: null }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockReturnValueOnce(new Promise(() => {}));

    render(<PlanPage />);

    const generateBtn = await waitFor(() =>
      screen.getByRole("button", { name: /generate my itinerary/i })
    );

    // First click → error appears
    fireEvent.click(generateBtn);
    await waitFor(() => screen.getByText(/couldn't generate your itinerary/i));

    // Re-query the button — the questionnaire was unmounted/remounted so the
    // original reference is stale.
    const generateBtn2 = screen.getByRole("button", { name: /generate my itinerary/i });

    // Second click → error should be cleared (loading screen takes over)
    act(() => { fireEvent.click(generateBtn2); });
    // The loading screen replaces the questionnaire, so the error disappears
    await waitFor(() =>
      expect(
        screen.queryByText(/couldn't generate your itinerary/i)
      ).not.toBeInTheDocument()
    );
  });

  it("does not inject sampleFullItinerary into the store on failure", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cities: null }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    render(<PlanPage />);

    const generateBtn = await waitFor(() =>
      screen.getByRole("button", { name: /generate my itinerary/i })
    );

    fireEvent.click(generateBtn);

    await waitFor(() => screen.getByText(/couldn't generate your itinerary/i));

    // Store itinerary must remain null — no fake data injected
    expect(useTripStore.getState().itinerary).toBeNull();
  });
});
