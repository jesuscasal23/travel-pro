import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createBrowserClientMock = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: createBrowserClientMock,
}));

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

describe("createClient", () => {
  beforeEach(() => {
    vi.resetModules();
    createBrowserClientMock.mockReset();
    delete (globalThis as { supabaseBrowserClient?: unknown }).supabaseBrowserClient;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
    delete (globalThis as { supabaseBrowserClient?: unknown }).supabaseBrowserClient;
  });

  it("reuses a single browser client instance", async () => {
    const client = { auth: {} };
    createBrowserClientMock.mockReturnValue(client);

    const { createClient } = await import("../supabase-client");

    expect(createClient()).toBe(client);
    expect(createClient()).toBe(client);
    expect(createBrowserClientMock).toHaveBeenCalledTimes(1);
    expect(createBrowserClientMock).toHaveBeenCalledWith("https://supabase.test", "anon-key");
  });

  it("returns null without instantiating when env is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "";

    const { createClient } = await import("../supabase-client");

    expect(createClient()).toBeNull();
    expect(createBrowserClientMock).not.toHaveBeenCalled();
  });
});
