import { NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { apiHandler, requireSuperUser } from "@/lib/api/helpers";

export const GET = apiHandler("GET /api/v1/admin/stats", async () => {
  await requireSuperUser();

  const [totalUsers, totalTrips, totalItineraries, recentUsers, recentTrips, generationsByStatus] =
    await Promise.all([
      prisma.profile.count(),
      prisma.trip.count(),
      prisma.itinerary.count(),
      prisma.profile.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.trip.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.itinerary.groupBy({
        by: ["generationStatus"],
        _count: true,
      }),
    ]);

  const statusCounts = Object.fromEntries(
    generationsByStatus.map((g) => [g.generationStatus, g._count])
  );

  return NextResponse.json({
    totalUsers,
    totalTrips,
    totalItineraries,
    recentUsers,
    recentTrips,
    generationsByStatus: statusCounts,
  });
});
