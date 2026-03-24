import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTripGeneration } from "@/hooks/api";

vi.mock("@/lib/utils/trip/trip-metadata", () => ({
  parseItineraryData: vi.fn((raw) => raw),
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

import { parseItineraryData } from "@/lib/utils/trip/trip-metadata";
import { reportApiError } from "@/lib/client/api-error-reporting";

const mockParseItineraryData = parseItineraryData as ReturnType<typeof vi.fn>;
const mockReportApiError = reportApiError as ReturnType<typeof vi.fn>;
const originalFetch = global.fetch;

function createWrapper(queryClient: QueryClient) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

function makeSseResponse(lines: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(line));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

const baseParams = {
  tripId: "trip-1",
  promptVersion: "v1" as const,
};

const guestParams = {
  ...baseParams,
  profile: {
    nationality: "German",
    homeAirport: "FRA",
    travelStyle: "smart-budget",
    interests: ["culture", "food"],
  },
};

describe("useTripGeneration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParseItineraryData.mockImplementation((raw) => raw);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("streams stages, fetches completed trip, and returns parsed itinerary", async () => {
    const onStage = vi.fn();
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        makeSseResponse([
          'data: {"stage":"route"}\n\n',
          'data: {"stage":"done","trip_id":"trip-1"}\n\n',
        ])
      )
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            trip: { itineraries: [{ data: { route: [], days: [] } }] },
          }),
      });

    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const { result } = renderHook(() => useTripGeneration(), {
      wrapper: createWrapper(queryClient),
    });

    let output: unknown;
    await act(async () => {
      output = await result.current.mutateAsync({ ...baseParams, onStage });
    });

    expect(onStage).toHaveBeenCalledWith("route");
    expect(onStage).toHaveBeenCalledWith("done");
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "/api/v1/trips/trip-1/generate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ promptVersion: "v1" }),
      })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(2, "/api/v1/trips/trip-1", expect.any(Object));
    expect(mockParseItineraryData).toHaveBeenCalledWith({ route: [], days: [] });
    expect(output).toEqual({ route: [], days: [] });
  });

  it("includes profile in the request body when provided", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeSseResponse(['data: {"stage":"done","trip_id":"trip-1"}\n\n']))
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            trip: { itineraries: [{ data: { route: [], days: [] } }] },
          }),
      });

    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const { result } = renderHook(() => useTripGeneration(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync(guestParams);
    });

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "/api/v1/trips/trip-1/generate",
      expect.objectContaining({
        method: "POST",
      })
    );
    const firstCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(firstCall[1].body as string)).toEqual({
      promptVersion: "v1",
      profile: guestParams.profile,
    });
  });

  it("throws when SSE emits an error stage", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        makeSseResponse(['data: {"stage":"error","message":"Generation failed"}\n\n'])
      );

    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const { result } = renderHook(() => useTripGeneration(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(result.current.mutateAsync(baseParams)).rejects.toThrow("Generation failed");
  });

  it("throws when stream ends without done event", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(makeSseResponse(["data: not-json\n\n", 'data: {"stage":"route"}\n\n']));

    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const { result } = renderHook(() => useTripGeneration(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(result.current.mutateAsync(baseParams)).rejects.toThrow(
      /stream ended before completion/i
    );
    expect(mockReportApiError).toHaveBeenCalled();
  });

  it("throws immediately when generate endpoint response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      body: null,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ error: "Too many requests" }),
    });

    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const { result } = renderHook(() => useTripGeneration(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(result.current.mutateAsync(baseParams)).rejects.toThrow(/Generation failed/);
    expect(mockReportApiError).toHaveBeenCalled();
  });

  it("parses done events split across stream chunks", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeSseResponse(['data: {"stage":"do', 'ne","trip_id":"trip-1"}\n\n']))
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            trip: { itineraries: [{ data: { route: [], days: [] } }] },
          }),
      });

    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const { result } = renderHook(() => useTripGeneration(), {
      wrapper: createWrapper(queryClient),
    });

    let output: unknown;
    await act(async () => {
      output = await result.current.mutateAsync(baseParams);
    });

    expect(output).toEqual({ route: [], days: [] });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("stores trip detail in cache and invalidates trip queries on success", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeSseResponse(['data: {"stage":"done","trip_id":"trip-1"}\n\n']))
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            trip: { itineraries: [{ data: { route: [], days: [] } }] },
          }),
      });

    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useTripGeneration(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate(baseParams);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["trips"],
    });
    expect(queryClient.getQueryData(["trips", "detail", "trip-1"])).toEqual({
      itineraries: [{ data: { route: [], days: [] } }],
    });
  });
});
