import { NextResponse } from "next/server";
import { apiHandler, requireAuth, requireProfile } from "@/lib/api/helpers";
import { getCartForProfile } from "@/lib/features/selections/selection-service";

export const dynamic = "force-dynamic";

export const GET = apiHandler("GET /api/v1/selections/cart", async () => {
  const userId = await requireAuth();
  const profile = await requireProfile(userId);
  const trips = await getCartForProfile(profile.id);
  return NextResponse.json({ trips });
});
