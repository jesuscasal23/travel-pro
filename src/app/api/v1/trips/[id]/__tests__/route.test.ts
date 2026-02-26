// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { Itinerary } from "@/types";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    profile: { findUnique: vi.fn() },
    trip: { findUnique: vi.fn(), delete: vi.fn() },
    itineraryEdit: { create: vi.fn() },
  },
}));

vi.mock("@/lib/services/itinerary-service", () => ({
  findActiveItinerary: vi.fn(),
  createItineraryVersion: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUserId: vi.fn(),
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

import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUserId } from "@/lib/supabase/server";
import { findActiveItinerary, createItineraryVersion } from "@/lib/services/itinerary-service";
import { PATCH, DELETE } from "../route";

const mockPrisma = prisma as unknown as {
  profile: { findUnique: ReturnType<typeof vi.fn> };
  trip: {
    findUnique: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  itineraryEdit: { create: ReturnType<typeof vi.fn> };
};
const mockAuth = getAuthenticatedUserId as ReturnType<typeof vi.fn>;
const mockFindActiveItinerary = findActiveItinerary as ReturnType<typeof vi.fn>;
const mockCreateItineraryVersion = createItineraryVersion as ReturnType<typeof vi.fn>;

const tripId = "trip-1";
const profileId = "profile-1";

const itineraryData: Itinerary = {
  route: [],
  days: [],
};

function makePatchRequest(body: object) {
  return new NextRequest(`http://localhost:3000/api/v1/trips/${tripId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest() {
  return new NextRequest(`http://localhost:3000/api/v1/trips/${tripId}`, {
    method: "DELETE",
  });
}

beforeEach(() => {
  vi.clearAllMocks();

  mockAuth.mockResolvedValue("user-1");
  mockPrisma.profile.findUnique.mockResolvedValue({ id: profileId, userId: "user-1" });
  mockPrisma.trip.findUnique.mockResolvedValue({ id: tripId, profileId });
  mockFindActiveItinerary.mockResolvedValue({
    id: "itin-1",
    tripId,
    version: 1,
    promptVersion: "v1",
  });
  mockCreateItineraryVersion.mockResolvedValue({ id: "itin-2", version: 2 });
  mockPrisma.itineraryEdit.create.mockResolvedValue({});
  mockPrisma.trip.delete.mockResolvedValue({ id: tripId });
});

describe("PATCH /api/v1/trips/:id", () => {
  it("logs the edit and creates a new itinerary version when data is provided", async () => {
    const req = makePatchRequest({
      editType: "add_city",
      editPayload: { city: "Osaka" },
      description: "Added Osaka",
      data: itineraryData,
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: tripId }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockPrisma.itineraryEdit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        itineraryId: "itin-1",
        editType: "add_city",
        description: "Added Osaka",
      }),
    });
    expect(mockCreateItineraryVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        tripId,
        previousItineraryId: "itin-1",
        previousVersion: 1,
        promptVersion: "v1",
        data: itineraryData,
      })
    );
    expect(json.itinerary.id).toBe("itin-2");
  });

  it("returns success and only logs edit when no new itinerary data is provided", async () => {
    const req = makePatchRequest({
      editType: "reorder_cities",
      editPayload: { from: 1, to: 0 },
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: tripId }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ success: true, editLogged: true });
    expect(mockPrisma.itineraryEdit.create).toHaveBeenCalledTimes(1);
    expect(mockCreateItineraryVersion).not.toHaveBeenCalled();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = makePatchRequest({
      editType: "remove_city",
      editPayload: { cityId: "tokyo" },
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: tripId }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 when trip is owned by another profile", async () => {
    mockPrisma.trip.findUnique.mockResolvedValue({ id: tripId, profileId: "other-profile" });
    const req = makePatchRequest({
      editType: "remove_city",
      editPayload: { cityId: "tokyo" },
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: tripId }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toBe("Forbidden");
    expect(mockPrisma.itineraryEdit.create).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/v1/trips/:id", () => {
  it("deletes the trip for the owner", async () => {
    const req = makeDeleteRequest();

    const res = await DELETE(req, { params: Promise.resolve({ id: tripId }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ success: true });
    expect(mockPrisma.trip.delete).toHaveBeenCalledWith({ where: { id: tripId } });
  });
});
