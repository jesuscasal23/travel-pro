import { prisma } from "@/lib/core/prisma";
import type { Prisma } from "@prisma/client";
import type { ActivityDiscoveryCandidate } from "@/types";

interface RecordActivitySwipeInput {
  tripId: string;
  profileId: string | null;
  destination: string;
  decision: "liked" | "disliked";
  activity: ActivityDiscoveryCandidate;
  isFinal?: boolean;
}

export async function recordActivitySwipe(input: RecordActivitySwipeInput) {
  const swipe = await prisma.activitySwipe.create({
    data: {
      tripId: input.tripId,
      profileId: input.profileId,
      destination: input.destination,
      decision: input.decision,
      activityName: input.activity.name,
      activityData: input.activity as unknown as Prisma.InputJsonValue,
    },
  });

  if (input.isFinal) {
    await prisma.itinerary.updateMany({
      where: { tripId: input.tripId, isActive: true },
      data: { discoveryStatus: "completed" },
    });
  }

  return swipe;
}
