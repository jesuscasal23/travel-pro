import { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import { getAuthenticatedUserId } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

// ── Custom error class ──────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

// ── Auth guards ─────────────────────────────────────────────────

/** Returns userId or throws 401. */
export async function requireAuth(): Promise<string> {
  const userId = await getAuthenticatedUserId();
  if (!userId) throw new ApiError(401, "Unauthorized");
  return userId;
}

/** Returns profile or throws 404. */
export async function requireProfile(userId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) throw new ApiError(404, "Profile not found");
  return profile;
}

/** Returns trip after verifying ownership, or throws 403/404. */
export async function requireTripOwnership(tripId: string, profileId: string) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new ApiError(404, "Trip not found");
  if (trip.profileId !== profileId) throw new ApiError(403, "Forbidden");
  return trip;
}

// ── Request helpers ─────────────────────────────────────────────

/** Parse JSON body or throw 400. */
export async function parseJsonBody(req: NextRequest | Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON");
  }
}

/** Validate body with Zod schema or throw 400. */
export function validateBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", parsed.error.flatten().fieldErrors);
  }
  return parsed.data;
}

// ── Shared Prisma include for active itinerary ──────────────────
export const ACTIVE_ITINERARY_INCLUDE = {
  itineraries: {
    where: { isActive: true },
    orderBy: { version: "desc" as const },
    take: 1,
  },
};

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
  return async (
    req: NextRequest,
    ctx?: { params?: Promise<Record<string, string>> }
  ) => {
    try {
      const resolvedParams = ctx?.params ? await ctx.params : {};
      return await handler(req, resolvedParams);
    } catch (err) {
      if (err instanceof ApiError) {
        const body: Record<string, unknown> = { error: err.message };
        if (err.details) body.details = err.details;
        return NextResponse.json(body, { status: err.status });
      }
      console.error(`[${routeName}]`, err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
