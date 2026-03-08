// ============================================================
// Travel Pro — GET /api/v1/profile/export
// GDPR data export: returns all user data as JSON
// ============================================================
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiHandler, ApiError, requireAuth } from "@/lib/api/helpers";
import { serializeProfileWithPace } from "@/lib/profile/pace";

export const dynamic = "force-dynamic";

export const GET = apiHandler("GET /api/v1/profile/export", async () => {
  const userId = await requireAuth();

  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      trips: {
        include: {
          itineraries: {
            include: { edits: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    profile: serializeProfileWithPace(profile),
  });
});
