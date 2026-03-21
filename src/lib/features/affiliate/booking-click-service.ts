import { prisma } from "@/lib/core/prisma";

const BOOKING_CLICK_SELECT = {
  id: true,
  tripId: true,
  provider: true,
  clickType: true,
  city: true,
  metadata: true,
  createdAt: true,
} as const;

export async function getBookingClicksForTrip(tripId: string) {
  return prisma.affiliateClick.findMany({
    where: { tripId },
    select: BOOKING_CLICK_SELECT,
    orderBy: { createdAt: "desc" },
  });
}
