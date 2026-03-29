import { TripNotFoundError } from "@/lib/api/errors";
import { createLogger } from "@/lib/core/logger";
import { prisma } from "@/lib/core/prisma";
import { getRedis } from "@/lib/core/redis";
import { withTripLock } from "@/lib/core/with-trip-lock";
import { z } from "zod";
import { CreateTripInputSchema } from "./schemas";
import { TRIP_LIST_INCLUDE } from "./query-shapes";

type CreateTripInput = z.infer<typeof CreateTripInputSchema>;

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
  const { initialItinerary, ...tripData } = input;

  if (!initialItinerary) {
    return prisma.trip.create({
      data: { ...tripData, profileId },
    });
  }

  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.create({
      data: { ...tripData, profileId },
    });

    await tx.itinerary.create({
      data: {
        tripId: trip.id,
        data: initialItinerary as object,
        version: 1,
        isActive: true,
        promptVersion: "v1",
        buildStatus: "complete",
        discoveryStatus: "pending",
      },
    });

    return trip;
  });
}

async function deleteTripRedisData(input: { tripId: string }) {
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
    `trip-build:${input.tripId}`,
    `trip-build:${input.tripId}:*`,
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
    },
  });

  if (!trip) {
    throw new TripNotFoundError({ tripId });
  }

  await deleteTripRedisData({
    tripId: trip.id,
  });

  await withTripLock(tripId, async (tx) => {
    await tx.flightSelection.deleteMany({
      where: { tripId },
    });

    await tx.hotelSelection.deleteMany({
      where: { tripId },
    });

    await tx.discoveredActivity.deleteMany({
      where: { tripId },
    });

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
