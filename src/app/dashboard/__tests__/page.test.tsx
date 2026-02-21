// ============================================================
// Integration tests for DashboardPage
//
// Covers:
//   - Empty state shown when API returns an empty trip list
//   - Empty state shown when API call fails (no sampleTrips fallback)
//   - Trip cards rendered when API returns real trips
//   - No fake data is ever injected
// ============================================================

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useTripStore } from "@/stores/useTripStore";
import { mockFramerMotion, mockNextLink, mockNavbar, createTestQueryWrapper } from "@/__tests__/mocks";

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("@/components/Navbar", () => mockNavbar());

vi.mock("next/link", () => mockNextLink());

vi.mock("framer-motion", () => mockFramerMotion());

// ── Import subject after mocks ────────────────────────────────────────────────
import DashboardPage from "@/app/dashboard/page";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFetchSuccess(trips: unknown[]) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ trips }),
  });
}

function makeFetchError() {
  return vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
}

function makeFetchThrow() {
  return vi.fn().mockRejectedValue(new Error("Network error"));
}

const mockTrips = [
  {
    id: "trip-1",
    region: "Southeast Asia",
    dateStart: "2026-04-01",
    dateEnd: "2026-04-22",
    travelers: 2,
    createdAt: new Date().toISOString(),
    itineraries: [{ id: "itin-1", generationStatus: "complete" }],
  },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("DashboardPage", () => {
  beforeEach(() => {
    act(() => {
      useTripStore.setState({ displayName: "Alex" });
    });
    vi.restoreAllMocks();
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  it("shows skeleton placeholders while loading", () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {})); // never resolves
    render(<DashboardPage />, { wrapper: createTestQueryWrapper() });
    // Loading skeletons are rendered as animated divs
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  // ── Empty state ───────────────────────────────────────────────────────────

  it("shows the empty state when the API returns an empty trip list", async () => {
    global.fetch = makeFetchSuccess([]);
    render(<DashboardPage />, { wrapper: createTestQueryWrapper() });
    await waitFor(() => expect(screen.getByText("No trips yet")).toBeInTheDocument());
  });

  it("shows the empty-state call-to-action when no trips exist", async () => {
    global.fetch = makeFetchSuccess([]);
    render(<DashboardPage />, { wrapper: createTestQueryWrapper() });
    await waitFor(() => expect(screen.getByText("Start planning")).toBeInTheDocument());
  });

  it("shows an error state (not fake trips) when the API returns non-200", async () => {
    global.fetch = makeFetchError();
    render(<DashboardPage />, { wrapper: createTestQueryWrapper() });
    await waitFor(() => expect(screen.getByText("Couldn't load your trips")).toBeInTheDocument());
  });

  it("shows an error state (not fake trips) when the API call throws", async () => {
    global.fetch = makeFetchThrow();
    render(<DashboardPage />, { wrapper: createTestQueryWrapper() });
    await waitFor(() => expect(screen.getByText("Couldn't load your trips")).toBeInTheDocument());
  });

  it("does NOT display any trip region names when the API fails", async () => {
    global.fetch = makeFetchError();
    render(<DashboardPage />, { wrapper: createTestQueryWrapper() });
    await waitFor(() => screen.getByText("Couldn't load your trips"));
    // No trip card with a region should be in the document
    expect(screen.queryByText("Japan")).not.toBeInTheDocument();
    expect(screen.queryByText("Southeast Asia")).not.toBeInTheDocument();
  });

  // ── Real trips ────────────────────────────────────────────────────────────

  it("renders a trip card for each trip the API returns", async () => {
    global.fetch = makeFetchSuccess(mockTrips);
    render(<DashboardPage />, { wrapper: createTestQueryWrapper() });
    await waitFor(() => expect(screen.getByText("Southeast Asia")).toBeInTheDocument());
  });

  it("does not show the empty state when trips exist", async () => {
    global.fetch = makeFetchSuccess(mockTrips);
    render(<DashboardPage />, { wrapper: createTestQueryWrapper() });
    await waitFor(() => screen.getByText("Southeast Asia"));
    expect(screen.queryByText("No trips yet")).not.toBeInTheDocument();
  });

  it("shows Ready badge for complete trips", async () => {
    global.fetch = makeFetchSuccess(mockTrips);
    render(<DashboardPage />, { wrapper: createTestQueryWrapper() });
    await waitFor(() => expect(screen.getByText("Ready")).toBeInTheDocument());
  });
});
