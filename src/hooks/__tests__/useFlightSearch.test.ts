import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useBatchFlightSearch, useFlightSearch } from "../useFlightSearch";

vi.mock("@/lib/client/api-error-reporting", () => ({
  parseApiErrorResponse: vi.fn(async (res: Response, fallback: string) => ({
    message: `${fallback} (${res.status ?? 0})`,
    status: res.status ?? 0,
    requestId: "req-test",
    responseBody: undefined,
  })),
  reportApiError: vi.fn(async () => undefined),
}));

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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }

  return Wrapper;
}

describe("useFlightSearch", () => {
  it("starts with empty state", () => {
    const { result } = renderHook(() => useFlightSearch("trip-1"), { wrapper: createWrapper() });

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

    const wrapper = createWrapper();
    const hook = renderHook(() => useFlightSearch("trip-1"), { wrapper });
    await act(async () => {
      await hook.result.current.search("CDG", "NRT", "2026-06-01", 2);
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/v1/trips/trip-1/flights",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromIata: "CDG",
          toIata: "NRT",
          departureDate: "2026-06-01",
          travelers: 2,
        }),
        signal: expect.any(AbortSignal),
      })
    );
    await waitFor(() => expect(hook.result.current.results).toEqual(mockResults));
    expect(hook.result.current.loading).toBe(false);
    expect(hook.result.current.fetchedAt).toBe(1000);
  });

  it("sets loading to true during fetch", async () => {
    let resolvePromise: (value: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolvePromise = resolve;
    });

    vi.spyOn(globalThis, "fetch").mockReturnValueOnce(fetchPromise);

    const { result } = renderHook(() => useFlightSearch("trip-1"), { wrapper: createWrapper() });

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

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("handles error responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Trip not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { result } = renderHook(() => useFlightSearch("trip-1"), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.search("CDG", "NRT", "2026-06-01", 1);
    });

    await waitFor(() => expect(result.current.error).toBe("Search failed (404)"));
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("handles network failures", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useFlightSearch("trip-1"), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.search("CDG", "NRT", "2026-06-01", 1);
    });

    await waitFor(() => expect(result.current.error).toBe("Search failed"));
    expect(result.current.loading).toBe(false);
  });

  it("batch search refetches when travelers change", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ results: mockResults, fetchedAt: 1000 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ results: mockResults, fetchedAt: 2000 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

    const legs = [
      {
        fromIata: "CDG",
        toIata: "NRT",
        departureDate: "2026-06-01",
        results: [],
        fetchedAt: 0,
      },
    ];

    const { result, rerender } = renderHook(
      ({ travelers }) => useBatchFlightSearch("trip-1", legs, travelers, true),
      {
        initialProps: { travelers: 1 },
        wrapper: createWrapper(),
      }
    );

    await waitFor(() =>
      expect(result.current.getResultsForLeg("CDG", "NRT", "2026-06-01").fetchedAt).toBe(1000)
    );

    rerender({ travelers: 2 });

    await waitFor(() =>
      expect(result.current.getResultsForLeg("CDG", "NRT", "2026-06-01").fetchedAt).toBe(2000)
    );
  });
});
