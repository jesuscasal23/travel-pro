import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { queryKeys } from "@/hooks/api/keys";
import {
  usePrefetchRouteSelection,
  useFetchRouteSelection,
  buildCacheKey,
} from "@/hooks/api/useRouteSelection";

const originalFetch = global.fetch;

const params = {
  profile: {
    nationality: "German",
    homeAirport: "FRA",
    travelStyle: "comfort",
    interests: ["culture", "food"],
  },
  tripIntent: {
    id: "trip-1",
    tripType: "multi-city",
    region: "east-asia",
    dateStart: "2026-04-01",
    dateEnd: "2026-04-08",
    travelers: 2,
  },
};

const cities = [
  {
    id: "tokyo",
    city: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    iataCode: "NRT",
    lat: 35.68,
    lng: 139.69,
    minDays: 3,
    maxDays: 5,
  },
];

function createWrapper(queryClient: QueryClient) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

describe("useRouteSelection hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("buildCacheKey is deterministic for identical inputs", () => {
    const a = buildCacheKey({
      region: "east-asia",
      destinationCountry: "Japan",
      dateStart: "2026-04-01",
      dateEnd: "2026-04-08",
      travelStyle: "comfort",
    });
    const b = buildCacheKey({
      region: "east-asia",
      destinationCountry: "Japan",
      dateStart: "2026-04-01",
      dateEnd: "2026-04-08",
      travelStyle: "comfort",
    });

    expect(a).toBe(b);
  });

  it("fetches route selection and returns cities", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ cities }),
    });

    const queryClient = new QueryClient();
    const { result } = renderHook(() => useFetchRouteSelection(), {
      wrapper: createWrapper(queryClient),
    });

    const cacheKey = buildCacheKey({
      region: "east-asia",
      dateStart: "2026-04-01",
      dateEnd: "2026-04-08",
      travelStyle: "comfort",
    });

    let output: unknown;
    await act(async () => {
      output = await result.current(params, cacheKey);
    });

    expect(output).toEqual(cities);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/generate/select-route",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
    );
  });

  it("returns null when API response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });

    const queryClient = new QueryClient();
    const { result } = renderHook(() => useFetchRouteSelection(), {
      wrapper: createWrapper(queryClient),
    });

    const cacheKey = "test-key";
    let output: unknown;

    await act(async () => {
      output = await result.current(params, cacheKey);
    });

    expect(output).toBeNull();
  });

  it("prefetch populates cache and subsequent fetch uses cached result", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ cities }),
    });

    const queryClient = new QueryClient();
    const cacheKey = "prefetch-key";

    const prefetchHook = renderHook(() => usePrefetchRouteSelection(), {
      wrapper: createWrapper(queryClient),
    });
    const fetchHook = renderHook(() => useFetchRouteSelection(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      prefetchHook.result.current(params, cacheKey);
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(queryKeys.routeSelection.byParams(cacheKey))).toEqual(cities);
    });

    await act(async () => {
      const output = await fetchHook.result.current(params, cacheKey);
      expect(output).toEqual(cities);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
