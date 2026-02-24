import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useSaveProfile, useExportData, useDeleteAccount } from "@/hooks/api/useProfile";

const originalFetch = global.fetch;
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useProfile hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("saves profile successfully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const { result } = renderHook(() => useSaveProfile(), { wrapper: createWrapper() });

    await act(async () => {
      const output = await result.current.mutateAsync({
        nationality: "German",
        homeAirport: "FRA",
        travelStyle: "comfort",
        interests: ["food"],
      });
      expect(output).toEqual({ success: true });
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/profile",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("throws when profile save API fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false } as Response);
    const { result } = renderHook(() => useSaveProfile(), { wrapper: createWrapper() });

    await expect(
      result.current.mutateAsync({
        nationality: "German",
        homeAirport: "FRA",
        travelStyle: "comfort",
        interests: [],
      }),
    ).rejects.toThrow("Failed to save profile");
  });

  it("exports profile data and triggers file download", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ profile: { nationality: "German" } }),
    } as Response);

    const createUrlSpy = vi.fn(() => "blob:test");
    const revokeUrlSpy = vi.fn();
    URL.createObjectURL = createUrlSpy;
    URL.revokeObjectURL = revokeUrlSpy;

    const clickSpy = vi.fn();
    const anchor = {
      href: "",
      download: "",
      click: clickSpy,
    } as unknown as HTMLAnchorElement;
    const nativeCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation(((tagName: string) => {
        if (tagName.toLowerCase() === "a") {
          return anchor;
        }
        return nativeCreateElement(tagName);
      }) as typeof document.createElement);

    const { result } = renderHook(() => useExportData(), { wrapper: createWrapper() });

    await act(async () => {
      const output = await result.current.mutateAsync();
      expect(output).toEqual({ profile: { nationality: "German" } });
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/v1/profile/export");
    expect(createUrlSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeUrlSpy).toHaveBeenCalledWith("blob:test");
    createElementSpy.mockRestore();
  });

  it("throws when export API fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false } as Response);
    const { result } = renderHook(() => useExportData(), { wrapper: createWrapper() });
    await expect(result.current.mutateAsync()).rejects.toThrow("Export failed");
  });

  it("deletes account successfully and throws on API failure", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ deleted: true }),
      } as Response)
      .mockResolvedValueOnce({ ok: false } as Response);

    const { result } = renderHook(() => useDeleteAccount(), { wrapper: createWrapper() });

    await act(async () => {
      const output = await result.current.mutateAsync();
      expect(output).toEqual({ deleted: true });
    });

    await expect(result.current.mutateAsync()).rejects.toThrow("Failed to delete account");
  });
});
