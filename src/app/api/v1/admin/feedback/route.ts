import { NextRequest, NextResponse } from "next/server";
import { apiHandler, requireSuperUser } from "@/lib/api/helpers";
import { listFeedbackForAdmin } from "@/lib/features/feedback/feedback-service";

export const GET = apiHandler("GET /api/v1/admin/feedback", async (req: NextRequest) => {
  await requireSuperUser();
  const result = await listFeedbackForAdmin(new URL(req.url));

  return NextResponse.json(result);
});
