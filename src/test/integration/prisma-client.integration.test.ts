// ============================================================
// Prisma Client Initialization — Integration Tests
// These tests would have caught the production bug where
// PrismaClient was constructed without datasourceUrl.
// ============================================================
import { describe, it, expect } from "vitest";
import { getPrisma, prisma } from "@/lib/core/prisma";

describe("PrismaClient initialization", () => {
  it("getPrisma() returns a client that can query the database", async () => {
    const client = getPrisma();
    const result: Array<{ n: number }> = await client.$queryRaw`SELECT 1 as n`;
    expect(result).toEqual([{ n: 1 }]);
  });

  it("prisma proxy export can execute a query", async () => {
    const result: Array<{ n: number }> = await prisma.$queryRaw`SELECT 1 as n`;
    expect(result).toEqual([{ n: 1 }]);
  });

  it("prisma.trip.findMany() works (migrations applied correctly)", async () => {
    const trips = await prisma.trip.findMany({ take: 1 });
    expect(Array.isArray(trips)).toBe(true);
  });

  it("prisma.profile model is accessible", async () => {
    const profiles = await prisma.profile.findMany({ take: 1 });
    expect(Array.isArray(profiles)).toBe(true);
  });

  it("prisma.itinerary model is accessible", async () => {
    const itineraries = await prisma.itinerary.findMany({ take: 1 });
    expect(Array.isArray(itineraries)).toBe(true);
  });
});
