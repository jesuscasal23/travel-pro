// ============================================================
// Travel Pro — Trip Service
// Business logic for trip-level operations. No HTTP concerns.
// ============================================================
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { createLogger } from "@/lib/logger";
import type { TripIntent } from "@/types";

const log = createLogger("trip-service");

/** Shape of a Trip row from Prisma (subset of fields we need) */
interface TripRecord {
  id: string;
  tripType: string;
  region: string;
  destination: string | null;
  destinationCountry: string | null;
  destinationCountryCode: string | null;
  dateStart: string;
  dateEnd: string;
  flexibleDates: boolean;
  budget: number;
  travelers: number;
}

/**
 * Reconstruct a TripIntent from a Trip database record.
 * Handles null→undefined coalescing and type casting.
 */
export function tripToIntent(trip: TripRecord): TripIntent {
  return {
    id: trip.id,
    tripType: (trip.tripType as TripIntent["tripType"]) ?? "multi-city",
    region: trip.region,
    destination: trip.destination ?? undefined,
    destinationCountry: trip.destinationCountry ?? undefined,
    destinationCountryCode: trip.destinationCountryCode ?? undefined,
    dateStart: trip.dateStart,
    dateEnd: trip.dateEnd,
    flexibleDates: trip.flexibleDates,
    budget: trip.budget,
    travelers: trip.travelers,
  };
}

/**
 * Get or create a share token for a trip.
 * Returns the existing token if present, otherwise generates and persists a new one.
 */
export async function ensureShareToken(tripId: string): Promise<string> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { shareToken: true },
  });

  if (trip?.shareToken) {
    return trip.shareToken;
  }

  const token = crypto.randomBytes(9).toString("base64url"); // 12-char URL-safe token
  log.info("Generated share token", { tripId });

  await prisma.trip.update({
    where: { id: tripId },
    data: { shareToken: token },
  });

  return token;
}
