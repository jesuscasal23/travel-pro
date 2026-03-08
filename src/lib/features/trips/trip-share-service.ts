import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { createLogger } from "@/lib/logger";
import { getAppUrl } from "@/lib/config/server-env";
import { TripNotFoundError } from "@/lib/api/errors";
import { SHARE_TOKEN_SELECT } from "./query-shapes";

const log = createLogger("trip-share-service");
const SHARE_TOKEN_BYTES = 9;
const MAX_SHARE_TOKEN_ATTEMPTS = 3;

function generateShareToken(): string {
  return crypto.randomBytes(SHARE_TOKEN_BYTES).toString("base64url");
}

export async function getOrCreateTripShareToken(tripId: string): Promise<string> {
  for (let attempt = 1; attempt <= MAX_SHARE_TOKEN_ATTEMPTS; attempt++) {
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
