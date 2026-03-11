// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockLogError = vi.hoisted(() => vi.fn());

vi.mock("@/lib/core/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: mockLogError,
  }),
}));

vi.mock("@/lib/core/request-context", () => ({
  requestContext: {
    run: (_ctx: unknown, fn: () => unknown) => fn(),
  },
}));

import { POST } from "../route";

describe("POST /api/v1/client-errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts valid client error payloads and logs them", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/client-errors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "vitest",
      },
      body: JSON.stringify({
        source: "useTripGeneration",
        endpoint: "/api/v1/trips/trip-1/generate",
        method: "POST",
        message: "Generation failed (429)",
        status: 429,
        requestId: "req-123",
        responseBody: { error: "Too many requests" },
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(202);
    expect(json).toEqual({ ok: true });
    expect(mockLogError).toHaveBeenCalledWith(
      "Client API error reported",
      expect.objectContaining({
        source: "useTripGeneration",
        endpoint: "/api/v1/trips/trip-1/generate",
        status: 429,
        requestId: "req-123",
      })
    );
  });

  it("returns 400 for invalid payload", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/client-errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "useTripGeneration",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Validation failed");
    expect(mockLogError).not.toHaveBeenCalled();
  });
});
