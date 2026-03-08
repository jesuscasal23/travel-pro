// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock("@/lib/request-context", () => ({
  requestContext: {
    run: (_ctx: unknown, fn: () => unknown) => fn(),
  },
}));

import { GET } from "../route";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.DATABASE_URL;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("returns 207 with missing checks when env vars are not configured", async () => {
    const req = new NextRequest("http://localhost:3000/api/health");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(207);
    expect(json.healthy).toBe(false);
    expect(json.checks.database).toBe("missing");
    expect(res.headers.get("x-request-id")).toBeTruthy();
  });
});
