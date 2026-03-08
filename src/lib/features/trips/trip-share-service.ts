import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { createLogger } from "@/lib/logger";
import { getAppUrl } from "@/lib/config/server-env";
import { SHARE_TOKEN_SELECT } from "./query-shapes";

const log = createLogger("trip-share-service");

export async function getOrCreateTripShareToken(tripId: string): Promise<string> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: SHARE_TOKEN_SELECT,
  });

  if (trip?.shareToken) {
    return trip.shareToken;
  }

  const token = crypto.randomBytes(9).toString("base64url");
  log.info("Generated share token", { tripId });

  await prisma.trip.update({
    where: { id: tripId },
    data: { shareToken: token },
  });

  return token;
}

export function serializeTripShareToken(shareToken: string) {
  return {
    shareToken,
    shareUrl: `${getAppUrl()}/share/${shareToken}`,
  };
}
