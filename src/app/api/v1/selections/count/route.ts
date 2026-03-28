import { NextResponse } from "next/server";
import { apiHandler, requireAuth, requireProfile } from "@/lib/api/helpers";
import { getUnbookedCountForProfile } from "@/lib/features/selections/selection-service";

export const dynamic = "force-dynamic";

export const GET = apiHandler("GET /api/v1/selections/count", async () => {
  const userId = await requireAuth();
  const profile = await requireProfile(userId);
  const count = await getUnbookedCountForProfile(profile.id);
  return NextResponse.json({ count });
});
