import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { CreateTripInputSchema } from "./schemas";
import { TRIP_LIST_INCLUDE } from "./query-shapes";

export type CreateTripInput = z.infer<typeof CreateTripInputSchema>;

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

export async function deleteTripById(tripId: string) {
  await prisma.trip.delete({ where: { id: tripId } });
  return { success: true as const };
}
