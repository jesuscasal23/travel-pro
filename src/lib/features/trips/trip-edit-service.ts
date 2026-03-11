import { prisma } from "@/lib/core/prisma";
import { ActiveItineraryNotFoundError } from "@/lib/api/errors";
import { createItineraryVersion, findActiveItinerary } from "./itinerary-service";
import type { Itinerary } from "@/types";

interface SaveTripEditInput {
  tripId: string;
  editType: string;
  editPayload: Record<string, unknown>;
  description?: string;
  data?: Itinerary;
}

export async function saveTripEdit(input: SaveTripEditInput) {
  const currentItinerary = await findActiveItinerary(input.tripId);
  if (!currentItinerary) {
    throw new ActiveItineraryNotFoundError({ tripId: input.tripId });
  }

  await prisma.itineraryEdit.create({
    data: {
      itineraryId: currentItinerary.id,
      editType: input.editType,
      editPayload: input.editPayload as object,
      description: input.description,
    },
  });

  if (!input.data) {
    return { success: true as const, editLogged: true as const };
  }

  const itinerary = await createItineraryVersion({
    tripId: input.tripId,
    data: input.data,
    promptVersion: currentItinerary.promptVersion,
    previousItineraryId: currentItinerary.id,
    previousVersion: currentItinerary.version,
  });

  return { itinerary };
}
