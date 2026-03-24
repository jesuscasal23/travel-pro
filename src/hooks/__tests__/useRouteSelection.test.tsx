import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useFetchRouteSelection, buildCacheKey } from "@/hooks/api";

const originalFetch = global.fetch;

const params = {
  profile: {
    nationality: "German",
    homeAirport: "FRA",
    travelStyle: "smart-budget",
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
    const a = buildCacheKey(params);
    const b = buildCacheKey(params);

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

    const cacheKey = buildCacheKey(params);

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

  it("buildCacheKey changes when query inputs change", () => {
    const base = buildCacheKey(params);
    const changedTravelers = buildCacheKey({
      ...params,
      tripIntent: { ...params.tripIntent, travelers: 3 },
    });
    const changedInterests = buildCacheKey({
      ...params,
      profile: { ...params.profile, interests: ["nightlife"] },
    });

    expect(changedTravelers).not.toBe(base);
    expect(changedInterests).not.toBe(base);
  });
});
