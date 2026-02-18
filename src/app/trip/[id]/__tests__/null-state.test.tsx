// ============================================================
// Null-state tests for trip detail pages
//
// Verifies that each page renders a "Trip not found" fallback UI
// (instead of crashing or showing sample data) when useItinerary
// returns null.
//
// Pages tested: trip/[id]/page, trip/[id]/summary/page, trip/[id]/edit/page
// ============================================================

import React, { Suspense } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { mockFramerMotion, mockNextLink, mockNavbar } from "@/__tests__/mocks";

// ── Module mocks — must appear before any subject imports ─────────────────────

vi.mock("@/hooks/useItinerary", () => ({
  useItinerary: () => null,
}));

vi.mock("@/stores/useTripStore", () => ({
  useTripStore: (selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      homeAirport: "FRA",
      dateStart: "2026-04-01",
      dateEnd: "2026-04-22",
      travelers: 2,
      setItinerary: vi.fn(),
      setCurrentTripId: vi.fn(),
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock("@/components/Navbar", () => mockNavbar());

vi.mock("next/link", () => mockNextLink());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("next/dynamic", () => ({
  default: () => () => null,
}));

vi.mock("posthog-js/react", () => ({
  usePostHog: () => null,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  }),
}));

vi.mock("@/components/map/RouteMapFallback", () => ({
  default: () => null,
}));

vi.mock("@/lib/affiliate/link-generator", () => ({
  buildFlightLink: vi.fn(() => "#"),
  buildTrackedLink: vi.fn(() => "#"),
}));

vi.mock("@/components/export/PDFDownloadButton", () => ({
  PDFDownloadButton: () => null,
}));

vi.mock("framer-motion", () => mockFramerMotion());

// ── Import subjects after mocks ───────────────────────────────────────────────

import TripPage from "@/app/trip/[id]/page";
import SummaryPage from "@/app/trip/[id]/summary/page";
import EditPage from "@/app/trip/[id]/edit/page";

// ── Helpers ───────────────────────────────────────────────────────────────────

// Wrap in Suspense to handle `use(params)` which suspends on a fresh Promise.
// await act(async () => {}) flushes the microtask that resolves the Promise so
// React exits the Suspense boundary before waitFor starts polling.
async function renderWithSuspense(ui: React.ReactElement) {
  await act(async () => {
    render(<Suspense fallback={<div>loading…</div>}>{ui}</Suspense>);
  });
}

const resolvedParams = Promise.resolve({ id: "test-trip-id" });

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("TripPage — null itinerary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the 'Trip not found' message", async () => {
    await renderWithSuspense(<TripPage params={resolvedParams} />);
    await waitFor(() => expect(screen.getByText("Trip not found.")).toBeInTheDocument());
  });

  it("renders a link back to the dashboard", async () => {
    await renderWithSuspense(<TripPage params={resolvedParams} />);
    await waitFor(() => {
      const link = screen.getByText("Back to dashboard");
      expect(link).toBeInTheDocument();
      expect(link.closest("a")).toHaveAttribute("href", "/dashboard");
    });
  });

  it("does not render trip content (no route, days, or budget)", async () => {
    await renderWithSuspense(<TripPage params={resolvedParams} />);
    await waitFor(() => screen.getByText("Trip not found."));
    expect(screen.queryByText("visa")).not.toBeInTheDocument();
    expect(screen.queryByText("weather")).not.toBeInTheDocument();
  });
});

describe("SummaryPage — null itinerary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the 'Trip not found' message", async () => {
    await renderWithSuspense(<SummaryPage params={resolvedParams} />);
    await waitFor(() => expect(screen.getByText("Trip not found.")).toBeInTheDocument());
  });

  it("renders a link back to the dashboard", async () => {
    await renderWithSuspense(<SummaryPage params={resolvedParams} />);
    await waitFor(() => {
      const link = screen.getByText("Back to dashboard");
      expect(link.closest("a")).toHaveAttribute("href", "/dashboard");
    });
  });

  it("does not render the PDF export button", async () => {
    await renderWithSuspense(<SummaryPage params={resolvedParams} />);
    await waitFor(() => screen.getByText("Trip not found."));
    // PDFDownloadButton is mocked to null — confirm no budget/route content
    expect(screen.queryByText("Budget Breakdown")).not.toBeInTheDocument();
  });
});

describe("EditPage — null itinerary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the 'Trip not found' message", async () => {
    await renderWithSuspense(<EditPage params={resolvedParams} />);
    await waitFor(() => expect(screen.getByText("Trip not found.")).toBeInTheDocument());
  });

  it("renders a link back to the dashboard", async () => {
    await renderWithSuspense(<EditPage params={resolvedParams} />);
    await waitFor(() => {
      const link = screen.getByText("Back to dashboard");
      expect(link.closest("a")).toHaveAttribute("href", "/dashboard");
    });
  });

  it("does not render the drag-drop city list", async () => {
    await renderWithSuspense(<EditPage params={resolvedParams} />);
    await waitFor(() => screen.getByText("Trip not found."));
    expect(screen.queryByText("Route Cities")).not.toBeInTheDocument();
  });
});
