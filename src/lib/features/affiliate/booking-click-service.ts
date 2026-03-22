import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/core/prisma";

const BOOKING_CLICK_SELECT = {
  id: true,
  tripId: true,
  provider: true,
  clickType: true,
  city: true,
  metadata: true,
  bookingConfirmed: true,
  createdAt: true,
} as const;

export async function getBookingClicksForTrip(tripId: string) {
  return prisma.affiliateClick.findMany({
    where: { tripId },
    select: BOOKING_CLICK_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

export async function confirmBookingClick(clickId: string, confirmed: boolean) {
  return prisma.affiliateClick.update({
    where: { id: clickId },
    data: { bookingConfirmed: confirmed },
    select: BOOKING_CLICK_SELECT,
  });
}

/**
 * Create a manual booking record — for users who booked outside the app
 * and want to mark an item as completed from the preparation checklist.
 */
export async function createManualBooking(input: {
  tripId: string;
  clickType: "flight" | "hotel";
  city?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.affiliateClick.create({
    data: {
      tripId: input.tripId,
      provider: "manual",
      clickType: input.clickType,
      city: input.city ?? null,
      destination: null,
      url: "",
      userId: input.userId ?? null,
      metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
      bookingConfirmed: true,
    },
    select: BOOKING_CLICK_SELECT,
  });
}
