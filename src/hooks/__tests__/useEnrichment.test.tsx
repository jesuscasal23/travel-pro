import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { CityStop } from "@/types";
import { useVisaEnrichment, useWeatherEnrichment } from "@/hooks/api/useEnrichment";

const originalFetch = global.fetch;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

const route: CityStop[] = [
  {
    id: "paris",
    city: "Paris",
    country: "France",
    countryCode: "FR",
    lat: 48.85,
    lng: 2.35,
    days: 2,
  },
];

describe("useEnrichment hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("does not call visa enrichment API when query is disabled", async () => {
    global.fetch = vi.fn();
    renderHook(() => useVisaEnrichment("German", route, false), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it("fetches and returns visa enrichment data when enabled", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ visaData: [{ country: "France", label: "Visa-free" }] }),
    } as Response);

    const { result } = renderHook(() => useVisaEnrichment("German", route, true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/enrich/visa",
      expect.objectContaining({
        method: "POST",
      })
    );
    expect(result.current.data).toEqual([{ country: "France", label: "Visa-free" }]);
  });

  it("surfaces visa enrichment errors for non-ok responses", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false } as Response);

    const { result } = renderHook(() => useVisaEnrichment("German", route, true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 4_000 });
    expect(result.current.error?.message).toBe("Failed to load visa data");
  });

  it("fetches and returns weather enrichment data when enabled", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ weatherData: [{ city: "Paris", temp: "20C", condition: "Sunny" }] }),
    } as Response);

    const { result } = renderHook(() => useWeatherEnrichment(route, "2026-06-01", true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/enrich/weather",
      expect.objectContaining({
        method: "POST",
      })
    );
    expect(result.current.data).toEqual([{ city: "Paris", temp: "20C", condition: "Sunny" }]);
  });

  it("does not call weather enrichment API when missing required inputs", async () => {
    global.fetch = vi.fn();
    renderHook(() => useWeatherEnrichment([], "", true), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it("surfaces weather enrichment errors for non-ok responses", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false } as Response);

    const { result } = renderHook(() => useWeatherEnrichment(route, "2026-06-01", true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 4_000 });
    expect(result.current.error?.message).toBe("Failed to load weather data");
  });
});
