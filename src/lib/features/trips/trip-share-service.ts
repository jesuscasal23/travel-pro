import crypto from "crypto";
import { prisma } from "@/lib/core/prisma";
import { createLogger } from "@/lib/core/logger";
import { getAppUrl } from "@/lib/config/server-env";
import { TripNotFoundError } from "@/lib/api/errors";
import { SHARE_TOKEN_BYTES, SHARE_TOKEN_MAX_ATTEMPTS } from "@/lib/config/constants";
import { SHARE_TOKEN_SELECT } from "./query-shapes";

const log = createLogger("trip-share-service");

function generateShareToken(): string {
  return crypto.randomBytes(SHARE_TOKEN_BYTES).toString("base64url");
}

export async function getOrCreateTripShareToken(tripId: string): Promise<string> {
  for (let attempt = 1; attempt <= SHARE_TOKEN_MAX_ATTEMPTS; attempt++) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: SHARE_TOKEN_SELECT,
    });

    if (!trip) {
      throw new TripNotFoundError({ tripId });
    }

    if (trip.shareToken) {
      return trip.shareToken;
    }

    const token = generateShareToken();
    log.info("Generated share token", { tripId, attempt });

    const result = await prisma.trip.updateMany({
      where: {
        id: tripId,
        shareToken: null,
      },
      data: { shareToken: token },
    });

    if (result.count === 1) {
      return token;
    }
  }

  throw new Error(`Failed to create share token for trip "${tripId}"`);
}

export function serializeTripShareToken(shareToken: string) {
  return {
    shareToken,
    shareUrl: `${getAppUrl()}/share/${shareToken}`,
  };
}
