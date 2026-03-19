import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { apiHandler, requireSuperUser } from "@/lib/api/helpers";

export const GET = apiHandler("GET /api/v1/admin/trips", async (req: NextRequest) => {
  await requireSuperUser();

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? "20")));
  const search = url.searchParams.get("search") ?? "";

  const where = search
    ? {
        OR: [
          { destination: { contains: search, mode: "insensitive" as const } },
          { region: { contains: search, mode: "insensitive" as const } },
          { id: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        profile: { select: { nationality: true, homeAirport: true } },
        _count: { select: { itineraries: true } },
      },
    }),
    prisma.trip.count({ where }),
  ]);

  return NextResponse.json({
    trips: trips.map((t) => ({
      id: t.id,
      tripType: t.tripType,
      region: t.region,
      destination: t.destination,
      dateStart: t.dateStart,
      dateEnd: t.dateEnd,
      travelers: t.travelers,
      itineraryCount: t._count.itineraries,
      hasProfile: !!t.profileId,
      profileNationality: t.profile?.nationality ?? null,
      profileAirport: t.profile?.homeAirport ?? null,
      createdAt: t.createdAt,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});
