import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/core/supabase-server", () => ({
  getAuthenticatedUserId: vi.fn(),
}));

import { redirect } from "next/navigation";
import { getAuthenticatedUserId } from "@/lib/core/supabase-server";
import { requirePageAuth } from "../require-page-auth";

describe("requirePageAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the user id when authenticated", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-123");

    await expect(requirePageAuth("/trips/trip-1")).resolves.toBe("user-123");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated users to login with the requested path", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue(null);

    await expect(requirePageAuth("/trips/trip-1")).rejects.toThrow(
      "REDIRECT:/login?next=%2Ftrips%2Ftrip-1"
    );
    expect(redirect).toHaveBeenCalledWith("/login?next=%2Ftrips%2Ftrip-1");
  });
});
