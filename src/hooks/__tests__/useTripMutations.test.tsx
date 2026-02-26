import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCreateTrip, useSaveTripEdit, useShareTrip } from "@/hooks/api/useTripMutations";

const originalFetch = global.fetch;

vi.mock("@/stores/useTripStore", () => ({
  useTripStore: {
    getState: () => ({
      itinerary: {
        route: [],
        days: [],
      },
    }),
  },
}));

vi.mock("@/lib/client/api-error-reporting", () => ({
  parseApiErrorResponse: vi.fn(async (res: Response, fallback: string) => ({
    message: `${fallback} (${res.status ?? 0})`,
    status: res.status ?? 0,
    requestId: "req-test",
    responseBody: undefined,
  })),
  reportApiError: vi.fn(async () => undefined),
}));

import { reportApiError } from "@/lib/client/api-error-reporting";

const mockReportApiError = reportApiError as ReturnType<typeof vi.fn>;

function createWrapper(queryClient: QueryClient) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

describe("useTripMutations", () => {
  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("creates a trip and invalidates trip list queries on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ trip: { id: "trip-1" } }),
    } as Response);

    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateTrip(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      const output = await result.current.mutateAsync({
        tripType: "multi-city",
        region: "europe",
        dateStart: "2026-06-01",
        dateEnd: "2026-06-10",
        travelers: 2,
      });
      expect(output).toEqual({ trip: { id: "trip-1" } });
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/trips",
      expect.objectContaining({ method: "POST" })
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["trips"] });
  });

  it("throws when create trip endpoint returns non-ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ error: "Too many requests" }),
    } as Response);

    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const { result } = renderHook(() => useCreateTrip(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync({
        tripType: "multi-city",
        region: "europe",
        dateStart: "2026-06-01",
        dateEnd: "2026-06-10",
        travelers: 2,
      })
    ).rejects.toThrow(/Failed to create trip/);
    expect(mockReportApiError).toHaveBeenCalled();
  });

  it("saves trip edits via PATCH and exposes save-failure meta message", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const { result } = renderHook(() => useSaveTripEdit(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      const output = await result.current.mutateAsync({
        tripId: "trip-1",
        editType: "route-update",
        editPayload: { changed: true },
        description: "Updated route",
        data: { route: [], days: [] },
      });
      expect(output).toEqual({ ok: true });
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/trips/trip-1",
      expect.objectContaining({ method: "PATCH" })
    );

    const mutation = queryClient.getMutationCache().getAll()[0];
    expect(mutation?.options.meta).toEqual({
      errorToast: "Your trip edits couldn't be saved. They may be lost on refresh.",
    });
  });

  it("throws when save trip edit endpoint returns non-ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false } as Response);

    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const { result } = renderHook(() => useSaveTripEdit(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync({
        tripId: "trip-1",
        editType: "route-update",
        editPayload: { changed: true },
        description: "Updated route",
        data: { route: [], days: [] },
      })
    ).rejects.toThrow("Save failed");
  });

  it("generates share links and surfaces share endpoint failures", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          shareToken: "token-1",
          shareUrl: "https://example.com/share/token-1",
        }),
      } as Response)
      .mockResolvedValueOnce({ ok: false } as Response);

    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const { result } = renderHook(() => useShareTrip(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      const output = await result.current.mutateAsync("trip-1");
      expect(output.shareToken).toBe("token-1");
    });

    await expect(result.current.mutateAsync("trip-1")).rejects.toThrow(
      "Failed to generate share link"
    );
  });
});
