// ============================================================
// Unit tests for useItinerary hook
//
// Covers:
//   - Returns null when the store has no itinerary (no sampleData fallback)
//   - Returns the real itinerary when one is in the store
//   - Reflects store updates reactively
// ============================================================

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useItinerary } from "@/hooks/useItinerary";
import { useTripStore } from "@/stores/useTripStore";
import type { Itinerary } from "@/types";

const mockItinerary: Itinerary = {
  route: [
    { id: "tokyo", city: "Tokyo", country: "Japan", lat: 35.68, lng: 139.69, days: 3, countryCode: "JP" },
  ],
  days: [
    {
      day: 1,
      date: "Oct 1",
      city: "Tokyo",
      activities: [
        { name: "Senso-ji Temple", category: "culture", icon: "⛩️", why: "Historic.", duration: "2h" },
      ],
    },
  ],
  visaData: [],
  weatherData: [],
};

describe("useItinerary", () => {
  beforeEach(() => {
    act(() => {
      useTripStore.setState({ itinerary: null });
    });
  });

  it("returns null when the store has no itinerary", () => {
    const { result } = renderHook(() => useItinerary());
    expect(result.current).toBeNull();
  });

  it("returns the itinerary when one is in the store", () => {
    act(() => {
      useTripStore.setState({ itinerary: mockItinerary });
    });

    const { result } = renderHook(() => useItinerary());
    expect(result.current).toBe(mockItinerary);
  });

  it("does not fall back to sample data when the store is empty", () => {
    const { result } = renderHook(() => useItinerary());
    // Must be strictly null — no sampleFullItinerary fallback
    expect(result.current).toBeNull();
  });

  it("returns the correct route from a stored itinerary", () => {
    act(() => {
      useTripStore.setState({ itinerary: mockItinerary });
    });

    const { result } = renderHook(() => useItinerary());
    expect(result.current?.route).toHaveLength(1);
    expect(result.current?.route[0].city).toBe("Tokyo");
  });

  it("reflects a store update from null to itinerary", () => {
    const { result } = renderHook(() => useItinerary());
    expect(result.current).toBeNull();

    act(() => {
      useTripStore.setState({ itinerary: mockItinerary });
    });

    expect(result.current).toBe(mockItinerary);
  });

  it("reflects a store update from itinerary back to null", () => {
    act(() => {
      useTripStore.setState({ itinerary: mockItinerary });
    });

    const { result } = renderHook(() => useItinerary());
    expect(result.current).not.toBeNull();

    act(() => {
      useTripStore.setState({ itinerary: null });
    });

    expect(result.current).toBeNull();
  });
});
