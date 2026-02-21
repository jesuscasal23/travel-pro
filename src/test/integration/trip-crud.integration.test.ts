// ============================================================
// Trip CRUD — Integration Tests (real database)
// ============================================================
import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  createTestTrip,
  createTestProfile,
  createTestItinerary,
} from "./helpers";

describe("Trip CRUD", () => {
  it("creates an anonymous trip (profileId: null)", async () => {
    const trip = await prisma.trip.create({
      data: {
        tripType: "multi-city",
        region: "southeast-asia",
        dateStart: "2026-04-01",
        dateEnd: "2026-04-22",
        travelers: 2,
      },
    });

    expect(trip.id).toBeDefined();
    expect(trip.tripType).toBe("multi-city");
    expect(trip.profileId).toBeNull();
    expect(trip.createdAt).toBeInstanceOf(Date);
  });

  it("creates a trip linked to a profile", async () => {
    const profile = await createTestProfile(prisma, "user-crud-1");
    const trip = await createTestTrip(prisma, { profileId: profile.id });

    expect(trip.profileId).toBe(profile.id);

    const loaded = await prisma.trip.findUnique({
      where: { id: trip.id },
      include: { profile: true },
    });
    expect(loaded?.profile?.userId).toBe("user-crud-1");
  });

  it("reads a trip with its active itinerary", async () => {
    const trip = await createTestTrip(prisma);
    await createTestItinerary(prisma, trip.id, { isActive: true });
    await createTestItinerary(prisma, trip.id, {
      isActive: false,
      version: 2,
    });

    const loaded = await prisma.trip.findUnique({
      where: { id: trip.id },
      include: {
        itineraries: { where: { isActive: true }, take: 1 },
      },
    });

    expect(loaded?.itineraries).toHaveLength(1);
    expect(loaded?.itineraries[0].isActive).toBe(true);
  });

  it("deleting a trip cascades to itineraries", async () => {
    const trip = await createTestTrip(prisma);
    const itin = await createTestItinerary(prisma, trip.id);

    await prisma.trip.delete({ where: { id: trip.id } });

    const deletedItin = await prisma.itinerary.findUnique({
      where: { id: itin.id },
    });
    expect(deletedItin).toBeNull();
  });

  it("enforces shareToken uniqueness constraint", async () => {
    await createTestTrip(prisma, { shareToken: "unique-token-1" });

    await expect(
      createTestTrip(prisma, { shareToken: "unique-token-1" }),
    ).rejects.toThrow();
  });

  it("allows multiple trips without shareToken (null is not unique)", async () => {
    const t1 = await createTestTrip(prisma);
    const t2 = await createTestTrip(prisma);

    expect(t1.shareToken).toBeNull();
    expect(t2.shareToken).toBeNull();
  });
});
