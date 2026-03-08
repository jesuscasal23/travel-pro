import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/helpers";
import { getHealthStatus } from "@/lib/features/health/health-service";

export const dynamic = "force-dynamic";

export const GET = apiHandler("GET /api/health", async () => {
  const { healthy, checks } = await getHealthStatus();
  return NextResponse.json({ healthy, checks }, { status: healthy ? 200 : 207 });
});
