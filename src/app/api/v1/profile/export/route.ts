// ============================================================
// Travel Pro — GET /api/v1/profile/export
// GDPR data export: returns all user data as JSON
// ============================================================
import { NextResponse } from "next/server";
import { apiHandler, requireAuth } from "@/lib/api/helpers";
import { serializeProfile } from "@/lib/features/profile/profile-serializer";
import { exportProfileData } from "@/lib/features/profile/profile-service";

export const dynamic = "force-dynamic";

export const GET = apiHandler("GET /api/v1/profile/export", async () => {
  const userId = await requireAuth();
  const profile = await exportProfileData(userId);

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    profile: serializeProfile(profile),
  });
});
