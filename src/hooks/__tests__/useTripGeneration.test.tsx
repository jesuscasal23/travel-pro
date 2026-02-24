import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTripGeneration } from "@/hooks/api/useTripGeneration";

vi.mock("@/lib/utils/trip-metadata", () => ({
  parseItineraryData: vi.fn((raw) => raw),
}));

import { parseItineraryData } from "@/lib/utils/trip-metadata";

const mockParseItineraryData = parseItineraryData as ReturnType<typeof vi.fn>;
const originalFetch = global.fetch;

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
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
  profile: {
    nationality: "German",
    homeAirport: "FRA",
    travelStyle: "comfort",
    interests: ["culture", "food"],
  },
  promptVersion: "v1",
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
        ]),
      )
      .mockResolvedValueOnce({
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
      expect.objectContaining({ method: "POST" }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(2, "/api/v1/trips/trip-1");
    expect(mockParseItineraryData).toHaveBeenCalledWith({ route: [], days: [] });
    expect(output).toEqual({ route: [], days: [] });
  });

  it("throws when SSE emits an error stage", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      makeSseResponse(['data: {"stage":"error"}\n\n']),
    );

    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const { result } = renderHook(() => useTripGeneration(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync(baseParams),
    ).rejects.toThrow("Generation failed");
  });

  it("returns null when stream has no done event with trip_id", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      makeSseResponse([
        "data: not-json\n\n",
        'data: {"stage":"route"}\n\n',
      ]),
    );

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

    expect(output).toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("throws immediately when generate endpoint response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, body: null });

    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const { result } = renderHook(() => useTripGeneration(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync(baseParams),
    ).rejects.toThrow("Generation failed");
  });

  it("invalidates trip detail query on success", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        makeSseResponse(['data: {"stage":"done","trip_id":"trip-1"}\n\n']),
      )
      .mockResolvedValueOnce({
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
      queryKey: ["trips", "detail", "trip-1"],
    });
  });
});

