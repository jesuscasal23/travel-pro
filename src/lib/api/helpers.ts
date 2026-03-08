import { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import { getAuthenticatedUserId } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { createLogger } from "@/lib/logger";
import { requestContext } from "@/lib/request-context";
import { hasGuestTripOwnerCookie } from "@/lib/api/guest-trip-ownership";
import {
  ApiError,
  InvalidJsonError,
  ProfileNotFoundError,
  TripNotFoundError,
  TripOwnerRequiredError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/api/errors";
import { TRIP_ACCESS_SELECT } from "@/lib/features/trips/query-shapes";

const log = createLogger("api");

// ── Auth guards ─────────────────────────────────────────────────

/** Returns userId or throws 401. */
export async function requireAuth(): Promise<string> {
  const userId = await getAuthenticatedUserId();
  if (!userId) throw new UnauthorizedError();
  return userId;
}

/** Returns profile or throws 404. */
export async function requireProfile(userId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) throw new ProfileNotFoundError({ userId });
  return profile;
}

/** Returns trip after verifying ownership, or throws 403/404. */
export async function requireUserTripOwner(tripId: string, profileId: string) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TripNotFoundError({ tripId });
  if (trip.profileId !== profileId) throw new TripOwnerRequiredError({ tripId, profileId });
  return trip;
}

/**
 * Access policy for trip routes:
 * - `allowGuestId`: permit synthetic `tripId === "guest"` requests for stateless guest flows.
 * - `requireTripOwner`: enforce auth+ownership for user trips and owner-cookie checks for guest trips.
 */
export async function assertTripAccess(
  req: NextRequest,
  tripId: string,
  options: {
    allowGuestId?: boolean;
    requireTripOwner?: boolean;
  } = {}
) {
  if (options.allowGuestId && tripId === "guest") return;

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: TRIP_ACCESS_SELECT,
  });

  if (!trip) throw new TripNotFoundError({ tripId });

  if (options.requireTripOwner) {
    if (trip.profileId) {
      const userId = await requireAuth();
      const profile = await requireProfile(userId);
      if (trip.profileId !== profile.id) {
        throw new TripOwnerRequiredError({ tripId, profileId: profile.id });
      }
    } else if (!hasGuestTripOwnerCookie(req, tripId)) {
      throw new TripOwnerRequiredError({ tripId, ownerType: "guest" });
    }
  }

  return trip;
}

// ── Request helpers ─────────────────────────────────────────────

/** Parse JSON body or throw 400. */
export async function parseJsonBody(req: NextRequest | Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new InvalidJsonError();
  }
}

/** Validate body with Zod schema or throw 400. */
export function validateBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.flatten().fieldErrors);
  }
  return parsed.data;
}

/** Parse JSON request body and validate it against a Zod schema. */
export async function parseAndValidateRequest<T>(
  req: NextRequest | Request,
  schema: z.ZodType<T>
): Promise<T> {
  return validateBody(schema, await parseJsonBody(req));
}

export function parseAndValidateSearchParams<T>(
  searchParams:
    | URLSearchParams
    | { entries(): IterableIterator<[string, string]> }
    | Record<string, string | undefined>,
  schema: z.ZodType<T>
): T {
  if (searchParams instanceof URLSearchParams) {
    return validateBody(schema, Object.fromEntries(searchParams.entries()));
  }

  if (typeof (searchParams as URLSearchParams).entries === "function") {
    return validateBody(schema, Object.fromEntries((searchParams as URLSearchParams).entries()));
  }

  return validateBody(schema, searchParams);
}

// ── IP extraction ───────────────────────────────────────────────
export function getClientIp(req: NextRequest | Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
}

// ── Route handler wrapper ───────────────────────────────────────
type ApiRouteHandler = (
  req: NextRequest,
  params: Record<string, string>
) => Promise<NextResponse | Response>;

export function apiHandler(routeName: string, handler: ApiRouteHandler) {
  return async (req: NextRequest, ctx?: { params?: Promise<Record<string, string>> }) => {
    const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

    return requestContext.run({ requestId }, async () => {
      try {
        const resolvedParams = ctx?.params ? await ctx.params : {};
        const response = await handler(req, resolvedParams);
        response.headers.set("x-request-id", requestId);
        return response;
      } catch (err) {
        if (err instanceof ApiError) {
          const body: Record<string, unknown> = { error: err.message };
          if (err.details) body.details = err.details;
          const response = NextResponse.json(body, { status: err.status });
          response.headers.set("x-request-id", requestId);
          return response;
        }
        log.error("Unhandled route error", {
          route: routeName,
          error: err instanceof Error ? (err.stack ?? err.message) : String(err),
        });
        const response = NextResponse.json({ error: "Internal server error" }, { status: 500 });
        response.headers.set("x-request-id", requestId);
        return response;
      }
    });
  };
}

export {
  ApiError,
  ActiveItineraryNotFoundError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ServiceMisconfiguredError,
  UnauthorizedError,
  UpstreamServiceError,
  ValidationError,
} from "@/lib/api/errors";
