import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/core/prisma";
import { createLogger } from "@/lib/core/logger";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { AffiliateEvents } from "@/lib/analytics/events";
import { estimateAffiliateCommission } from "@/lib/analytics/affiliate-metrics";

const log = createLogger("booking-click");

const BOOKING_CLICK_SELECT = {
  id: true,
  tripId: true,
  provider: true,
  clickType: true,
  city: true,
  metadata: true,
  bookingConfirmed: true,
  createdAt: true,
  userId: true,
} as const;

export async function getBookingClicksForTrip(tripId: string) {
  return prisma.affiliateClick.findMany({
    where: { tripId },
    select: BOOKING_CLICK_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

export async function confirmBookingClick(clickId: string, confirmed: boolean) {
  const click = await prisma.affiliateClick.update({
    where: { id: clickId },
    data: { bookingConfirmed: confirmed },
    select: BOOKING_CLICK_SELECT,
  });
  if (confirmed) {
    const metadata = click.metadata as Record<string, unknown> | null;
    void captureServerEvent(
      AffiliateEvents.BookingConfirmed,
      {
        provider: click.provider,
        click_type: click.clickType,
        trip_id: click.tripId,
        city: click.city,
        estimated_commission_eur: estimateAffiliateCommission(click.provider, metadata),
      },
      click.userId ?? click.tripId ?? undefined
    );
  }
  return click;
}

/**
 * Create a manual booking record — for users who booked outside the app
 * and want to mark an item as completed from the preparation checklist.
 */
/**
 * Track a flight booking click — fire-and-forget.
 * Callers should wrap in try/catch so tracking never blocks the redirect.
 */
export async function trackFlightBookingClick(input: {
  bookingUrl: string;
  bookWith: string;
  price?: number;
  tripId: string | null;
  userId: string | null;
  ipHash: string;
  fromIata: string;
  toIata: string;
  departureDate: string;
}) {
  try {
    await prisma.affiliateClick.create({
      data: {
        provider: input.bookWith.toLowerCase(),
        clickType: "flight",
        destination: new URL(input.bookingUrl).hostname,
        url: input.bookingUrl,
        tripId: input.tripId,
        userId: input.userId,
        ipHash: input.ipHash,
        metadata: {
          type: "flight",
          fromIata: input.fromIata,
          toIata: input.toIata,
          departureDate: input.departureDate,
          airline: input.bookWith,
          price: input.price,
        },
      },
    });
    void captureServerEvent(
      AffiliateEvents.LinkClicked,
      {
        provider: input.bookWith.toLowerCase(),
        click_type: "flight",
        trip_id: input.tripId,
        estimated_commission_eur: estimateAffiliateCommission(input.bookWith, {
          price: input.price,
        }),
        metadata: {
          type: "flight",
          fromIata: input.fromIata,
          toIata: input.toIata,
          departureDate: input.departureDate,
          airline: input.bookWith,
          price: input.price,
        },
      },
      input.userId ?? input.tripId ?? undefined
    );
  } catch (error) {
    log.error("Failed to track flight booking click", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function createManualBooking(input: {
  tripId: string;
  clickType: "flight" | "hotel";
  city?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}) {
  const click = await prisma.affiliateClick.create({
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
  void captureServerEvent(
    AffiliateEvents.BookingConfirmed,
    {
      provider: click.provider,
      click_type: click.clickType,
      trip_id: click.tripId,
      city: click.city ?? input.city ?? null,
      estimated_commission_eur: estimateAffiliateCommission("booking", input.metadata ?? null),
    },
    input.userId ?? click.tripId ?? undefined
  );
  return click;
}
