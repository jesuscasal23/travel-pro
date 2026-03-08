import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { getGuestTripOwnerSecret } from "@/lib/config/server-env";

const GUEST_TRIP_OWNER_COOKIE_PREFIX = "travelpro_guest_trip_";
const GUEST_TRIP_OWNER_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;
const GUEST_TRIP_OWNER_SIGNATURE_VERSION = "v1";

function signGuestTripId(tripId: string): string {
  return createHmac("sha256", getGuestTripOwnerSecret())
    .update(`${GUEST_TRIP_OWNER_SIGNATURE_VERSION}:${tripId}`)
    .digest("base64url");
}

export function getGuestTripOwnerCookieName(tripId: string): string {
  return `${GUEST_TRIP_OWNER_COOKIE_PREFIX}${tripId}`;
}

export function createGuestTripOwnerCookie(tripId: string) {
  return {
    name: getGuestTripOwnerCookieName(tripId),
    value: `${GUEST_TRIP_OWNER_SIGNATURE_VERSION}.${signGuestTripId(tripId)}`,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_TRIP_OWNER_COOKIE_MAX_AGE_SECONDS,
  };
}

export function hasGuestTripOwnerCookie(req: NextRequest, tripId: string): boolean {
  const cookieValue = req.cookies.get(getGuestTripOwnerCookieName(tripId))?.value;

  if (!cookieValue) {
    return false;
  }

  const [version, providedSignature] = cookieValue.split(".", 2);
  if (version !== GUEST_TRIP_OWNER_SIGNATURE_VERSION || !providedSignature) {
    return false;
  }

  const expectedSignature = signGuestTripId(tripId);
  if (providedSignature.length !== expectedSignature.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature));
}
