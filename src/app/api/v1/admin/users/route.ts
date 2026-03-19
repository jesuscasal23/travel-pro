import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { apiHandler, requireSuperUser } from "@/lib/api/helpers";

export const GET = apiHandler("GET /api/v1/admin/users", async (req: NextRequest) => {
  await requireSuperUser();

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? "20")));
  const search = url.searchParams.get("search") ?? "";

  const where = search
    ? {
        OR: [
          { nationality: { contains: search, mode: "insensitive" as const } },
          { homeAirport: { contains: search, mode: "insensitive" as const } },
          { userId: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.profile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { trips: true } } },
    }),
    prisma.profile.count({ where }),
  ]);

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      userId: u.userId,
      nationality: u.nationality,
      homeAirport: u.homeAirport,
      travelStyle: u.travelStyle,
      interests: u.interests,
      isSuperUser: u.isSuperUser,
      onboardingCompleted: u.onboardingCompleted,
      tripCount: u._count.trips,
      createdAt: u.createdAt,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});
