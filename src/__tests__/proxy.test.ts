// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getUserMock = vi.fn();

const fromMock = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: getUserMock,
    },
    from: fromMock,
  })),
}));

import { proxy } from "@/proxy";

describe("proxy auth protection for /trips", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("redirects unauthenticated users to /login with next path", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const req = new NextRequest("http://localhost:3000/trips/trip-123");
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?next=%2Ftrips%2Ftrip-123");
  });

  it("allows authenticated premium users through", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { is_premium: true } }),
        }),
      }),
    });

    const req = new NextRequest("http://localhost:3000/trips/trip-123");
    const res = await proxy(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("x-request-id")).toBeTruthy();
  });

  it("redirects authenticated non-premium users to /premium", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { is_premium: false } }),
        }),
      }),
    });

    const req = new NextRequest("http://localhost:3000/trips/trip-123");
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/premium");
  });
});
