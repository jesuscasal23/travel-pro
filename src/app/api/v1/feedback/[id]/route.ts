import { NextRequest, NextResponse } from "next/server";
import { apiHandler, requireAuth } from "@/lib/api/helpers";
import { getFeedbackByIdForUser } from "@/lib/features/feedback/feedback-service";

export const GET = apiHandler("GET /api/v1/feedback/:id", async (_req: NextRequest, params) => {
  const userId = await requireAuth();
  const feedback = await getFeedbackByIdForUser(userId, params.id);

  return NextResponse.json({ feedback });
});
