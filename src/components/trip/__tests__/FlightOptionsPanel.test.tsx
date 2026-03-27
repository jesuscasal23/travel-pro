import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { FlightLegResults, FlightSearchResult } from "@/lib/flights/types";

// Mock the useFlightSearch hook
const mockSearch = vi.fn();
let mockHookState = {
  results: [] as FlightSearchResult[],
  loading: false,
  error: null as string | null,
  fetchedAt: null as number | null,
};

vi.mock("@/hooks/api/flights/useFlightSearch", () => ({
  useFlightSearch: () => ({
    ...mockHookState,
    search: mockSearch,
  }),
}));

vi.mock("@/lib/features/affiliate/link-generator", () => ({
  buildTrackedLink: vi.fn(
    (p: { dest: string }) => `/api/v1/affiliate/redirect?dest=${encodeURIComponent(p.dest)}`
  ),
}));

import { FlightOptionsPanel } from "../FlightOptionsPanel";

const makeResult = (overrides: Partial<FlightSearchResult> = {}): FlightSearchResult => ({
  price: 450,
  duration: "12h 30m",
  airline: "LH",
  stops: 0,
  departureTime: "2026-06-01T08:30:00",
  arrivalTime: "2026-06-01T20:00:00",
  cabin: "ECONOMY",
  bookingUrl: "https://skyscanner.net/flights/CDG/NRT",
  ...overrides,
});

const baseLeg: FlightLegResults = {
  fromIata: "CDG",
  toIata: "NRT",
  departureDate: "2026-06-01",
  results: [
    makeResult({ price: 320, airline: "TK", stops: 1, duration: "16h" }),
    makeResult({ price: 380, airline: "AF", stops: 1, duration: "14h 15m" }),
    makeResult({ price: 450, airline: "LH", stops: 0, duration: "12h 30m" }),
    makeResult({ price: 500, airline: "BA", stops: 1, duration: "15h" }),
    makeResult({ price: 550, airline: "EK", stops: 1, duration: "18h" }),
    makeResult({ price: 600, airline: "QR", stops: 1, duration: "17h" }),
    makeResult({ price: 650, airline: "SQ", stops: 0, duration: "13h" }),
    makeResult({ price: 700, airline: "JL", stops: 0, duration: "11h 45m" }),
  ],
  fetchedAt: Date.now(),
};

/** Count visible flight rows by their data-testid */
function getFlightRows() {
  return screen.getAllByTestId("flight-price");
}

/** Find the flight card containing a given price element */
function getFlightCard(priceEl: HTMLElement) {
  return priceEl.closest("[class*='rounded-xl']")!;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockHookState = {
    results: [],
    loading: false,
    error: null,
    fetchedAt: null,
  };
});

describe("FlightOptionsPanel", () => {
  it("renders leg header with IATA codes and formatted date", () => {
    render(<FlightOptionsPanel leg={baseLeg} tripId="trip-1" />);

    expect(screen.getByText("CDG")).toBeInTheDocument();
    expect(screen.getByText("NRT")).toBeInTheDocument();
    expect(screen.getByText("Jun 1")).toBeInTheDocument();
  });

  it("shows first 5 results by default", () => {
    render(<FlightOptionsPanel leg={baseLeg} tripId="trip-1" />);

    expect(getFlightRows()).toHaveLength(5);
  });

  it("expands to show all results when clicking 'Show more'", () => {
    render(<FlightOptionsPanel leg={baseLeg} tripId="trip-1" />);

    const showMore = screen.getByText(/Show 3 more/);
    fireEvent.click(showMore);

    expect(getFlightRows()).toHaveLength(8);
  });

  it("collapses back when clicking 'Show less'", () => {
    render(<FlightOptionsPanel leg={baseLeg} tripId="trip-1" />);

    fireEvent.click(screen.getByText(/Show 3 more/));
    fireEvent.click(screen.getByText(/Show less/));

    expect(getFlightRows()).toHaveLength(5);
  });

  it("toggles sort between cheapest and quickest", () => {
    render(<FlightOptionsPanel leg={baseLeg} tripId="trip-1" />);

    // Default sort is price — cheapest first (TK = Turkish Airlines)
    const firstCard = getFlightCard(getFlightRows()[0]);
    expect(firstCard).toHaveTextContent("TK");
    expect(firstCard).toHaveTextContent("€320");

    // Click quickest sort
    fireEvent.click(screen.getByText("Quickest"));

    // JL (11h 45m) should now be first (shortest duration)
    const firstAfterSort = getFlightCard(getFlightRows()[0]);
    expect(firstAfterSort).toHaveTextContent("JL");
  });

  it("shows Skyscanner fallback when no results", () => {
    const emptyLeg: FlightLegResults = { ...baseLeg, results: [] };

    render(<FlightOptionsPanel leg={emptyLeg} tripId="trip-1" />);

    expect(screen.getByText("Search on Skyscanner")).toBeInTheDocument();
  });

  it("triggers live search when clicking refresh", () => {
    render(<FlightOptionsPanel leg={baseLeg} tripId="trip-1" />);

    // Refresh is now an icon-only button — find by its RefreshCw svg class
    const allButtons = screen.getAllByRole("button");
    const refreshButton = allButtons.find((btn) => btn.querySelector(".lucide-refresh-cw"))!;
    fireEvent.click(refreshButton);

    expect(mockSearch).toHaveBeenCalledWith("CDG", "NRT", "2026-06-01", 1, undefined);
  });

  it("shows skeleton loading during search", () => {
    mockHookState.loading = true;

    render(<FlightOptionsPanel leg={baseLeg} tripId="trip-1" />);

    // Skeleton loading shows animated pulse cards
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });

  it("shows error message on search failure", () => {
    mockHookState.error = "Search failed";

    render(<FlightOptionsPanel leg={baseLeg} tripId="trip-1" />);

    expect(screen.getByText("Search failed")).toBeInTheDocument();
  });

  it("uses live results when available instead of prefetched", () => {
    const liveResults = [
      makeResult({ price: 200, airline: "QR", duration: "13h" }),
      makeResult({ price: 250, airline: "SQ", duration: "11h" }),
    ];
    mockHookState.results = liveResults;
    mockHookState.fetchedAt = Date.now();

    render(<FlightOptionsPanel leg={baseLeg} tripId="trip-1" />);

    // Should show live results, not prefetched
    const rows = getFlightRows();
    expect(rows).toHaveLength(2);
    const firstCard = getFlightCard(rows[0]);
    expect(firstCard).toHaveTextContent("QR");
    expect(firstCard).toHaveTextContent("€200");
  });

  it("displays Non-stop badge for 0 stops", () => {
    const nonstopLeg: FlightLegResults = {
      ...baseLeg,
      results: [makeResult({ stops: 0 })],
    };

    render(<FlightOptionsPanel leg={nonstopLeg} tripId="trip-1" />);

    expect(screen.getByText("Direct")).toBeInTheDocument();
  });

  it("displays stop count for 1+ stops", () => {
    const multiStopLeg: FlightLegResults = {
      ...baseLeg,
      results: [makeResult({ stops: 2 })],
    };

    render(<FlightOptionsPanel leg={multiStopLeg} tripId="trip-1" />);

    expect(screen.getByText(/2 Stops/)).toBeInTheDocument();
  });

  it("does not show 'Show more' when 5 or fewer results", () => {
    const shortLeg: FlightLegResults = {
      ...baseLeg,
      results: baseLeg.results.slice(0, 4),
    };

    render(<FlightOptionsPanel leg={shortLeg} tripId="trip-1" />);

    expect(screen.queryByText(/Show \d+ more/)).not.toBeInTheDocument();
  });

  it("renders booking links with tracked URLs", () => {
    const singleLeg: FlightLegResults = {
      ...baseLeg,
      results: [makeResult()],
    };

    render(<FlightOptionsPanel leg={singleLeg} tripId="trip-1" itineraryId="itin-1" />);

    const links = screen.getAllByRole("link");
    // Every link (flight rows + "Book on Skyscanner") should be tracked
    for (const link of links) {
      expect(link.getAttribute("href")).toContain("/api/v1/affiliate/redirect");
      expect(link.getAttribute("target")).toBe("_blank");
    }
  });

  it("filters by nonstop when stops filter is selected", () => {
    render(<FlightOptionsPanel leg={baseLeg} tripId="trip-1" />);

    // Open filters via the SlidersHorizontal icon button
    const allButtons = screen.getAllByRole("button");
    const filterBtn = allButtons.find((btn) => btn.querySelector(".lucide-sliders-horizontal"))!;
    fireEvent.click(filterBtn);

    // Click Nonstop filter button (inside the filter panel)
    const filterButtons = screen.getAllByRole("button");
    const nonstopBtn = filterButtons.find(
      (btn) => btn.textContent === "Nonstop" && btn.className.includes("rounded-full")
    )!;
    fireEvent.click(nonstopBtn);

    // Only nonstop flights should be visible (LH, SQ, JL)
    expect(getFlightRows()).toHaveLength(3);
  });

  it("shows 'no matches' message when all results are filtered out", () => {
    const stopsOnlyLeg: FlightLegResults = {
      ...baseLeg,
      results: [makeResult({ stops: 2 }), makeResult({ stops: 3, price: 800 })],
    };

    render(<FlightOptionsPanel leg={stopsOnlyLeg} tripId="trip-1" />);

    const allButtons = screen.getAllByRole("button");
    const filterBtn = allButtons.find((btn) => btn.querySelector(".lucide-sliders-horizontal"))!;
    fireEvent.click(filterBtn);

    const filterButtons = screen.getAllByRole("button");
    const nonstopBtn = filterButtons.find(
      (btn) => btn.textContent === "Nonstop" && btn.className.includes("rounded-full")
    )!;
    fireEvent.click(nonstopBtn);

    expect(screen.getByText("No flights match your filters")).toBeInTheDocument();
    expect(screen.getByText("Clear all filters")).toBeInTheDocument();
  });

  it("clears filters when 'Clear filters' is clicked", () => {
    render(<FlightOptionsPanel leg={baseLeg} tripId="trip-1" />);

    const allButtons = screen.getAllByRole("button");
    const filterBtn = allButtons.find((btn) => btn.querySelector(".lucide-sliders-horizontal"))!;
    fireEvent.click(filterBtn);

    const filterButtons = screen.getAllByRole("button");
    const nonstopBtn = filterButtons.find(
      (btn) => btn.textContent === "Nonstop" && btn.className.includes("rounded-full")
    )!;
    fireEvent.click(nonstopBtn);

    // Only 3 nonstop results
    expect(getFlightRows()).toHaveLength(3);

    // Clear
    fireEvent.click(screen.getByText("Clear filters"));

    // Back to 5 (default visible)
    expect(getFlightRows()).toHaveLength(5);
  });
});
