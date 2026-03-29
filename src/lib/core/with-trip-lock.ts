import { prisma } from "./prisma";

/**
 * Execute a callback inside a Prisma transaction with an advisory lock on the given tripId.
 * Prevents concurrent mutations (build, deletion) on the same trip.
 */
export async function withTripLock<T>(
  tripId: string,
  callback: (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${tripId}))`;
    return callback(tx);
  });
}
