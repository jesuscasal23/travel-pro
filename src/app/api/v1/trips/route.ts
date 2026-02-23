// ============================================================
// Travel Pro — GET/POST /api/v1/trips
// List user trips / create new trip
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUserId } from "@/lib/supabase/server";
import {
  apiHandler,
  requireAuth,
  requireProfile,
  parseJsonBody,
  validateBody,
} from "@/lib/api/helpers";

export const dynamic = "force-dynamic";

const CreateTripSchema = z.object({
  tripType: z.enum(["single-city", "single-country", "multi-city"]).default("multi-city"),
  region: z.string().max(100).default(""),
  destination: z.string().max(100).optional(),
  destinationCountry: z.string().max(100).optional(),
  destinationCountryCode: z.string().max(10).optional(),
  dateStart: z.string().max(20),
  dateEnd: z.string().max(20),
  flexibleDates: z.boolean().default(false),
  travelers: z.number().int().min(1).max(20).default(2),
  description: z.string().max(2000).optional(),
});

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
  const data = validateBody(CreateTripSchema, body);

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
  return NextResponse.json({ trip }, { status: 201 });
});
