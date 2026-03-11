// ============================================================
// Prisma Client Initialization — Integration Tests
// These tests would have caught the production bug where
// PrismaClient was constructed without datasourceUrl.
// ============================================================
import { describe, it, expect } from "vitest";
import { getPrisma } from "@/lib/core/prisma";

describe("PrismaClient initialization", () => {
  it("returns a client that can execute a query against the configured database", async () => {
    const client = getPrisma();
    const result: Array<{ n: number }> = await client.$queryRaw`SELECT 1 as n`;
    expect(result).toEqual([{ n: 1 }]);
  });
});
