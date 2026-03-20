// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/features/trips/trip-collection-service", () => ({
  deleteTripById: vi.fn(),
}));

vi.mock("@/lib/api/helpers", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/helpers")>("@/lib/api/helpers");
  return {
    ...actual,
    requireSuperUser: vi.fn(),
  };
});

vi.mock("@/lib/core/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock("@/lib/core/request-context", () => ({
  requestContext: {
    run: (_ctx: unknown, fn: () => unknown) => fn(),
  },
}));

import { ForbiddenError, TripNotFoundError } from "@/lib/api/errors";
import { requireSuperUser } from "@/lib/api/helpers";
import { deleteTripById } from "@/lib/features/trips/trip-collection-service";
import { DELETE } from "../route";

const mockRequireSuperUser = requireSuperUser as ReturnType<typeof vi.fn>;
const mockDeleteTripById = deleteTripById as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireSuperUser.mockResolvedValue({ userId: "user-1", profileId: "profile-1" });
  mockDeleteTripById.mockResolvedValue({ success: true });
});

describe("DELETE /api/v1/admin/trips/:id", () => {
  it("deletes the trip for a superuser", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/admin/trips/trip-1", {
      method: "DELETE",
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: "trip-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ success: true });
    expect(mockRequireSuperUser).toHaveBeenCalledTimes(1);
    expect(mockDeleteTripById).toHaveBeenCalledWith("trip-1");
  });

  it("returns 403 when the caller is not a superuser", async () => {
    mockRequireSuperUser.mockRejectedValueOnce(new ForbiddenError("Forbidden"));
    const req = new NextRequest("http://localhost:3000/api/v1/admin/trips/trip-1", {
      method: "DELETE",
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: "trip-1" }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toBe("Forbidden");
    expect(mockDeleteTripById).not.toHaveBeenCalled();
  });

  it("returns 404 when the trip does not exist", async () => {
    mockDeleteTripById.mockRejectedValueOnce(new TripNotFoundError({ tripId: "trip-missing" }));
    const req = new NextRequest("http://localhost:3000/api/v1/admin/trips/trip-missing", {
      method: "DELETE",
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: "trip-missing" }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("Trip not found");
  });
});
