// ============================================================
// Travel Pro — GET/POST /api/v1/trips
// List user trips / create new trip
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUserId } from "@/lib/supabase/server";
import { CreateTripInputSchema } from "@/lib/api/schemas";
import {
  apiHandler,
  requireAuth,
  requireProfile,
  parseJsonBody,
  validateBody,
} from "@/lib/api/helpers";
import { createGuestTripOwnerCookie } from "@/lib/api/guest-trip-ownership";

export const dynamic = "force-dynamic";

export const GET = apiHandler("GET /api/v1/trips", async () => {
  const userId = await requireAuth();
  const profile = await requireProfile(userId);

  const trips = await prisma.trip.findMany({
    where: { profileId: profile.id },
    include: {
      itineraries: {
        where: { isActive: true },
        select: { id: true, version: true, generationStatus: true, createdAt: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ trips });
});

export const POST = apiHandler("POST /api/v1/trips", async (req: NextRequest) => {
  const body = await parseJsonBody(req);
  const data = validateBody(CreateTripInputSchema, body);

  // Auto-set profileId from auth session (null for anonymous users)
  let profileId: string | null = null;
  const userId = await getAuthenticatedUserId();
  if (userId) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    profileId = profile?.id ?? null;
  }

  const trip = await prisma.trip.create({
    data: { ...data, profileId },
  });

  const response = NextResponse.json({ trip }, { status: 201 });
  if (!trip.profileId) {
    response.cookies.set(createGuestTripOwnerCookie(trip.id));
  }

  return response;
});
