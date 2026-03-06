import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFlightSearch } from "../useFlightSearch";

const mockResults = [
  {
    price: 320,
    duration: "16h",
    airline: "TK",
    stops: 1,
    departureTime: "2026-06-01T06:00:00",
    arrivalTime: "2026-06-01T22:00:00",
    cabin: "ECONOMY",
    bookingUrl: "https://skyscanner.net/flights/CDG/NRT",
  },
];

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("useFlightSearch", () => {
  it("starts with empty state", () => {
    const { result } = renderHook(() => useFlightSearch("trip-1"));

    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.fetchedAt).toBeNull();
  });

  it("fetches results on search call", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ results: mockResults, fetchedAt: 1000 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { result } = renderHook(() => useFlightSearch("trip-1"));

    await act(async () => {
      await result.current.search("CDG", "NRT", "2026-06-01", 2);
    });

    expect(fetchSpy).toHaveBeenCalledWith("/api/v1/trips/trip-1/flights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromIata: "CDG",
        toIata: "NRT",
        departureDate: "2026-06-01",
        travelers: 2,
      }),
    });
    expect(result.current.results).toEqual(mockResults);
    expect(result.current.loading).toBe(false);
    expect(result.current.fetchedAt).toBe(1000);
  });

  it("sets loading to true during fetch", async () => {
    let resolvePromise: (value: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolvePromise = resolve;
    });

    vi.spyOn(globalThis, "fetch").mockReturnValueOnce(fetchPromise);

    const { result } = renderHook(() => useFlightSearch("trip-1"));

    act(() => {
      void result.current.search("CDG", "NRT", "2026-06-01", 1);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    await act(async () => {
      resolvePromise!(
        new Response(JSON.stringify({ results: [], fetchedAt: 1000 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    expect(result.current.loading).toBe(false);
  });

  it("handles error responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Trip not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { result } = renderHook(() => useFlightSearch("trip-1"));

    await act(async () => {
      await result.current.search("CDG", "NRT", "2026-06-01", 1);
    });

    expect(result.current.error).toBe("Trip not found");
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("handles network failures", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useFlightSearch("trip-1"));

    await act(async () => {
      await result.current.search("CDG", "NRT", "2026-06-01", 1);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.loading).toBe(false);
  });
});
