// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  cleanupStaleGenerations: vi.fn(),
}));

vi.mock("@/lib/services/itinerary-service", () => ({
  cleanupStaleGenerations: mocks.cleanupStaleGenerations,
}));

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

describe("GET /api/cron/cleanup-stale-generations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "secret";
  });

  it("returns 401 when bearer token does not match", async () => {
    const req = new NextRequest("http://localhost:3000/api/cron/cleanup-stale-generations", {
      headers: { authorization: "Bearer wrong" },
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
    expect(mocks.cleanupStaleGenerations).not.toHaveBeenCalled();
  });

  it("returns cleaned count when authorized", async () => {
    mocks.cleanupStaleGenerations.mockResolvedValue(3);

    const req = new NextRequest("http://localhost:3000/api/cron/cleanup-stale-generations", {
      headers: { authorization: "Bearer secret" },
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true, cleaned: 3 });
  });
});
