// ============================================================
// Trip CRUD — Integration Tests (real database)
// ============================================================
import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  createTestTrip,
  createTestItinerary,
} from "./helpers";

describe("Trip CRUD", () => {
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
