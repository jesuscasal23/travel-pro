import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getDatabaseUrl } from "@/lib/config/server-env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Lazy-initialized Prisma client.
 * Avoids instantiation at build time (which crashes when DATABASE_URL is missing).
 *
 * Prisma v7 requires a driver adapter — we use @prisma/adapter-pg which
 * connects directly via the `pg` driver (no query-engine binary).
 *
 * Pool is capped at 2 connections per serverless instance to avoid exhausting
 * Supabase's session-mode connection limit under concurrent invocations.
 */
export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const connectionString = getDatabaseUrl();
  const adapter = new PrismaPg({
    connectionString,
    min: 0,
    max: 2,
    idleTimeoutMillis: 30_000,
  });
  const client = new PrismaClient({ adapter });

  globalForPrisma.prisma = client;

  return client;
}

/**
 * Named export convenience alias.
 * Uses a Proxy so PrismaClient is only instantiated on first property access,
 * keeping the build-time safety guarantee.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return Reflect.get(getPrisma(), prop);
  },
});
