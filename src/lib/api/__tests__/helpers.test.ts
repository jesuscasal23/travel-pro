// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// Mock Supabase auth
vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUserId: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/core/prisma", () => ({
  prisma: {
    profile: { findUnique: vi.fn() },
    trip: { findUnique: vi.fn() },
  },
}));

// Mock logger
vi.mock("@/lib/core/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import {
  apiHandler,
  getClientIp,
  parseAndValidateRequest,
  parseAndValidateSearchParams,
  validateBody,
} from "../helpers";
import { ApiError } from "../errors";
import { getAuthenticatedUserId } from "@/lib/supabase/server";
import { prisma } from "@/lib/core/prisma";

beforeEach(() => {
  vi.clearAllMocks();
});

// ── ApiError ─────────────────────────────────────────────────

describe("ApiError", () => {
  it("extends Error with status and details", () => {
    const err = new ApiError(400, "Bad request", { field: "name" });
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(400);
    expect(err.message).toBe("Bad request");
    expect(err.details).toEqual({ field: "name" });
  });

  it("works without details", () => {
    const err = new ApiError(500, "Server error");
    expect(err.details).toBeUndefined();
  });
});

// ── validateBody ─────────────────────────────────────────────

describe("validateBody", () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().int().positive(),
  });

  it("returns parsed data for valid body", () => {
    const result = validateBody(schema, { name: "Alice", age: 30 });
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  it("throws ApiError 400 on validation failure", () => {
    try {
      validateBody(schema, { name: "", age: -1 });
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(400);
      expect((err as ApiError).message).toBe("Validation failed");
      expect((err as ApiError).details).toBeDefined();
    }
  });

  it("throws ApiError 400 for missing fields", () => {
    try {
      validateBody(schema, {});
      expect.fail("should have thrown");
    } catch (err) {
      expect((err as ApiError).status).toBe(400);
    }
  });
});

// ── parseAndValidateRequest ──────────────────────────────────

describe("parseAndValidateRequest", () => {
  const schema = z.object({
    name: z.string().min(1),
  });

  it("parses JSON and validates the request body", async () => {
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Alice" }),
    });

    await expect(parseAndValidateRequest(req, schema)).resolves.toEqual({ name: "Alice" });
  });

  it("throws ApiError for invalid JSON", async () => {
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not-json",
    });

    await expect(parseAndValidateRequest(req, schema)).rejects.toMatchObject({
      status: 400,
      message: "Invalid JSON",
    });
  });
});

// ── getClientIp ──────────────────────────────────────────────

describe("getClientIp", () => {
  it("extracts first IP from x-forwarded-for", () => {
    const req = {
      headers: new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }),
    } as unknown as Request;
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("returns single IP", () => {
    const req = {
      headers: new Headers({ "x-forwarded-for": "10.0.0.1" }),
    } as unknown as Request;
    expect(getClientIp(req)).toBe("10.0.0.1");
  });

  it('returns "unknown" when header is missing', () => {
    const req = {
      headers: new Headers(),
    } as unknown as Request;
    expect(getClientIp(req)).toBe("unknown");
  });
});

// ── parseAndValidateSearchParams ─────────────────────────────

describe("parseAndValidateSearchParams", () => {
  const schema = z.object({
    q: z.string().min(1),
  });

  it("parses and validates query params", () => {
    const params = new URLSearchParams({ q: "tokyo" });
    expect(parseAndValidateSearchParams(params, schema)).toEqual({ q: "tokyo" });
  });
});

// ── apiHandler ───────────────────────────────────────────────

describe("apiHandler", () => {
  function makeRequest(): import("next/server").NextRequest {
    return {
      headers: new Headers(),
      nextUrl: new URL("http://localhost/api/test"),
    } as unknown as import("next/server").NextRequest;
  }

  it("calls handler and returns its response", async () => {
    const { NextResponse } = await import("next/server");
    const handler = apiHandler("test", async () => {
      return NextResponse.json({ ok: true });
    });

    const res = await handler(makeRequest());
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it("catches ApiError and returns structured error response", async () => {
    const handler = apiHandler("test", async () => {
      throw new ApiError(404, "Not found", { id: "123" });
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Not found");
    expect(body.details).toEqual({ id: "123" });
  });

  it("catches unknown errors and returns 500", async () => {
    const handler = apiHandler("test", async () => {
      throw new Error("unexpected");
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });

  it("resolves params from context", async () => {
    const { NextResponse } = await import("next/server");
    let capturedParams: Record<string, string> = {};
    const handler = apiHandler("test", async (_req, params) => {
      capturedParams = params;
      return NextResponse.json({ ok: true });
    });

    await handler(makeRequest(), { params: Promise.resolve({ id: "abc" }) });
    expect(capturedParams).toEqual({ id: "abc" });
  });
});

// ── requireAuth ──────────────────────────────────────────────

describe("requireAuth", () => {
  it("returns userId when authenticated", async () => {
    const { requireAuth } = await import("../helpers");
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-123");
    const result = await requireAuth();
    expect(result).toBe("user-123");
  });

  it("throws 401 when not authenticated", async () => {
    const { requireAuth } = await import("../helpers");
    vi.mocked(getAuthenticatedUserId).mockResolvedValue(null);
    await expect(requireAuth()).rejects.toThrow("Unauthorized");
  });
});

// ── requireProfile ───────────────────────────────────────────

describe("requireProfile", () => {
  it("returns profile when found", async () => {
    const { requireProfile } = await import("../helpers");
    const mockProfile = { id: "p1", userId: "u1", nationality: "German" };
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(mockProfile as never);
    const result = await requireProfile("u1");
    expect(result.nationality).toBe("German");
  });

  it("throws 404 when profile not found", async () => {
    const { requireProfile } = await import("../helpers");
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(null as never);
    await expect(requireProfile("u1")).rejects.toThrow("Profile not found");
  });
});

// ── requireUserTripOwner ─────────────────────────────────────

describe("requireUserTripOwner", () => {
  it("returns trip when ownership matches", async () => {
    const { requireUserTripOwner } = await import("../helpers");
    const mockTrip = { id: "t1", profileId: "p1", region: "Asia" };
    vi.mocked(prisma.trip.findUnique).mockResolvedValue(mockTrip as never);
    const result = await requireUserTripOwner("t1", "p1");
    expect(result.region).toBe("Asia");
  });

  it("throws 404 when trip not found", async () => {
    const { requireUserTripOwner } = await import("../helpers");
    vi.mocked(prisma.trip.findUnique).mockResolvedValue(null as never);
    await expect(requireUserTripOwner("t1", "p1")).rejects.toThrow("Trip not found");
  });

  it("throws 403 when ownership does not match", async () => {
    const { requireUserTripOwner } = await import("../helpers");
    const mockTrip = { id: "t1", profileId: "p-other" };
    vi.mocked(prisma.trip.findUnique).mockResolvedValue(mockTrip as never);
    await expect(requireUserTripOwner("t1", "p1")).rejects.toThrow("Forbidden");
  });
});
