import { Redis } from "@upstash/redis";
import { TripNotFoundError } from "@/lib/api/errors";
import { getOptionalRedisEnv } from "@/lib/config/server-env";
import { createLogger } from "@/lib/core/logger";
import { prisma } from "@/lib/core/prisma";
import { z } from "zod";
import { CreateTripInputSchema } from "./schemas";
import { TRIP_LIST_INCLUDE } from "./query-shapes";

export type CreateTripInput = z.infer<typeof CreateTripInputSchema>;

const log = createLogger("trip-collection-service");
const REDIS_SCAN_BATCH_SIZE = 100;

export async function listTripsForProfile(profileId: string) {
  return prisma.trip.findMany({
    where: { profileId },
    include: TRIP_LIST_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export async function createTrip(input: CreateTripInput, profileId: string | null) {
  return prisma.trip.create({
    data: { ...input, profileId },
  });
}

function getRedis(): Redis | null {
  const redisEnv = getOptionalRedisEnv();
  if (!redisEnv) {
    return null;
  }

  return new Redis(redisEnv);
}

async function deleteTripRedisData(input: { tripId: string; shareToken: string | null }) {
  const redis = getRedis();
  if (!redis) {
    return;
  }

  const keys = new Set<string>();
  const patterns = [
    `trip:${input.tripId}`,
    `trip:${input.tripId}:*`,
    `trips:${input.tripId}`,
    `trips:${input.tripId}:*`,
    `trip-generation:${input.tripId}`,
    `trip-generation:${input.tripId}:*`,
    ...(input.shareToken
      ? [`trip-share:${input.shareToken}`, `trip-share:${input.shareToken}:*`]
      : []),
  ];

  for (const pattern of patterns) {
    let cursor = "0";

    do {
      const [nextCursor, batch] = await redis.scan(cursor, {
        match: pattern,
        count: REDIS_SCAN_BATCH_SIZE,
      });

      for (const key of batch) {
        keys.add(key);
      }

      cursor = nextCursor;
    } while (cursor !== "0");
  }

  if (keys.size === 0) {
    return;
  }

  await redis.del(...keys);

  log.info("Deleted trip Redis keys", {
    tripId: input.tripId,
    redisKeyCount: keys.size,
  });
}

export async function deleteTripById(tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: {
      id: true,
      shareToken: true,
    },
  });

  if (!trip) {
    throw new TripNotFoundError({ tripId });
  }

  await deleteTripRedisData({
    tripId: trip.id,
    shareToken: trip.shareToken,
  });

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${tripId}))`;

    const itineraries = await tx.itinerary.findMany({
      where: { tripId },
      select: { id: true },
    });
    const itineraryIds = itineraries.map((itinerary) => itinerary.id);

    if (itineraryIds.length > 0) {
      await tx.itineraryEdit.deleteMany({
        where: { itineraryId: { in: itineraryIds } },
      });
    }

    await tx.affiliateClick.deleteMany({
      where: { tripId },
    });

    await tx.discoveredCity.updateMany({
      where: { firstTripId: tripId },
      data: { firstTripId: null },
    });

    await tx.itinerary.deleteMany({
      where: { tripId },
    });

    await tx.trip.delete({
      where: { id: tripId },
    });
  });

  return { success: true as const };
}
