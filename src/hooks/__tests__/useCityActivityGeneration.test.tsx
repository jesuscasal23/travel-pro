// ============================================================
// Unit tests for useCityActivityGeneration hook
//
// Verifies:
//   - Returns the full merged itinerary from the API (not just days)
//   - Throws on non-200 responses with the server error message
//   - onSuccess callback receives the full Itinerary for setItinerary()
// ============================================================

import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useCityActivityGeneration } from "@/hooks/api";
import type { Itinerary } from "@/types";
import type { ReactNode } from "react";

// ── Fixtures ──────────────────────────────────────────────────

const mergedItinerary: Itinerary = {
  route: [
    {
      id: "tokyo",
      city: "Tokyo",
      country: "Japan",
      lat: 35.68,
      lng: 139.69,
      days: 3,
      countryCode: "JP",
    },
    {
      id: "kyoto",
      city: "Kyoto",
      country: "Japan",
      lat: 35.01,
      lng: 135.77,
      days: 2,
      countryCode: "JP",
    },
  ],
  days: [
    {
      day: 1,
      date: "Oct 1",
      city: "Tokyo",
      activities: [
        { name: "Senso-ji", category: "culture", why: "Historic temple", duration: "2h" },
      ],
    },
    {
      day: 2,
      date: "Oct 2",
      city: "Tokyo",
      activities: [
        { name: "Shibuya", category: "explore", why: "Iconic crossing", duration: "3h" },
      ],
    },
    {
      day: 3,
      date: "Oct 3",
      city: "Tokyo",
      activities: [{ name: "Tsukiji", category: "food", why: "Fresh sushi", duration: "2h" }],
    },
    { day: 4, date: "Oct 4", city: "Kyoto", activities: [] },
    { day: 5, date: "Oct 5", city: "Kyoto", activities: [] },
  ],
};

const mutationParams = {
  tripId: "trip-1",
  cityId: "tokyo",
  cityName: "Tokyo",
};

const guestMutationParams = {
  ...mutationParams,
  profile: {
    nationality: "German",
    homeAirport: "FRA",
    travelStyle: "smart-budget",
    interests: ["culture", "food"],
  },
};

// ── Helpers ───────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

// ── Tests ─────────────────────────────────────────────────────

describe("useCityActivityGeneration", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns the full merged itinerary on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ itinerary: mergedItinerary }),
    });

    const { result } = renderHook(() => useCityActivityGeneration(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(mutationParams);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mergedItinerary);
    expect(result.current.data?.route).toHaveLength(2);
    expect(result.current.data?.days[0].activities).toHaveLength(1);
  });

  it("sends correct request to the API", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ itinerary: mergedItinerary }),
    });

    const { result } = renderHook(() => useCityActivityGeneration(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(mutationParams);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/trips/trip-1/generate-activities",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityId: "tokyo" }),
      })
    );
  });

  it("includes profile in the request when provided", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ itinerary: mergedItinerary }),
    });

    const { result } = renderHook(() => useCityActivityGeneration(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(guestMutationParams);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/trips/trip-1/generate-activities",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityId: "tokyo",
          profile: guestMutationParams.profile,
        }),
      })
    );
  });

  it("throws with server error message on non-200 response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Activities already generated for "Tokyo"' }),
    });

    const { result } = renderHook(() => useCityActivityGeneration(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(mutationParams);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Activities already generated for "Tokyo"');
  });

  it("uses fallback error message when response body is not JSON", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("invalid json")),
    });

    const { result } = renderHook(() => useCityActivityGeneration(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(mutationParams);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Activity generation failed");
  });

  it("calls onSuccess callback with the full itinerary", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ itinerary: mergedItinerary }),
    });

    const onSuccess = vi.fn();

    const { result } = renderHook(() => useCityActivityGeneration(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(mutationParams, { onSuccess });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(onSuccess).toHaveBeenCalledTimes(1);
    // First arg is the returned itinerary data
    expect(onSuccess.mock.calls[0][0]).toEqual(mergedItinerary);
    // Second arg is the mutation variables
    expect(onSuccess.mock.calls[0][1]).toEqual(mutationParams);
  });

  it("calls onSettled even after an error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    const onSettled = vi.fn();

    const { result } = renderHook(() => useCityActivityGeneration(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(mutationParams, { onSettled });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(onSettled).toHaveBeenCalledTimes(1);
  });
});
