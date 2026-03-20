// ============================================================
// Trip CRUD — Integration Tests (real database)
// ============================================================
import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/core/prisma";
import { createTestTrip, createTestItinerary } from "./helpers";

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
});
