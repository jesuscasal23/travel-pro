import { prisma } from "@/lib/core/prisma";
import { BadRequestError } from "@/lib/api/errors";
import { createLogger } from "@/lib/core/logger";
import { ITINERARY_TRIP_ID_SELECT } from "@/lib/features/trips/query-shapes";
import {
  getAffiliateDestinationHostname,
  hashIpAddress,
  isAllowedAffiliateDestination,
} from "./redirect-utils";

const log = createLogger("affiliate-redirect-service");

interface LogAffiliateRedirectInput {
  provider: "skyscanner" | "booking" | "getyourguide";
  type: "flight" | "hotel" | "activity";
  dest: string;
  itinerary_id?: string;
  city?: string;
  ip: string;
}

export async function logAffiliateRedirect(input: LogAffiliateRedirectInput) {
  if (!isAllowedAffiliateDestination(input.dest)) {
    throw new BadRequestError("Redirect destination not allowed", {
      dest: [input.dest],
    });
  }

  try {
    let tripId: string | undefined;
    if (input.itinerary_id) {
      const itinerary = await prisma.itinerary.findFirst({
        where: { id: input.itinerary_id },
        select: ITINERARY_TRIP_ID_SELECT,
      });
      tripId = itinerary?.tripId;
    }

    await prisma.affiliateClick.create({
      data: {
        provider: input.provider,
        clickType: input.type,
        city: input.city ?? null,
        destination: getAffiliateDestinationHostname(input.dest),
        url: input.dest,
        tripId: tripId ?? null,
        ipHash: hashIpAddress(input.ip),
      },
    });
  } catch (error) {
    log.error("Failed to log click", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return { redirectUrl: input.dest };
}
