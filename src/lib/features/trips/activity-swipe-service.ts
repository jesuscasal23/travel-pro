import { prisma } from "@/lib/core/prisma";

interface RecordActivitySwipeInput {
  tripId: string;
  activityId: string;
  decision: "liked" | "disliked";
  isFinal?: boolean;
}

export async function recordActivitySwipe(input: RecordActivitySwipeInput) {
  const activity = await prisma.discoveredActivity.update({
    where: { id: input.activityId },
    data: {
      decision: input.decision,
      decidedAt: new Date(),
    },
  });

  if (input.isFinal) {
    await prisma.itinerary.updateMany({
      where: { tripId: input.tripId, isActive: true },
      data: { discoveryStatus: "completed" },
    });
  }

  return activity;
}
