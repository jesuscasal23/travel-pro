import { NextRequest, NextResponse } from "next/server";
import { apiHandler, parseAndValidateRequest, requireAuth } from "@/lib/api/helpers";
import { getAuthenticatedUser } from "@/lib/core/supabase-server";
import { FeedbackCreateInputSchema } from "@/lib/features/feedback/schemas";
import {
  createFeedbackSubmission,
  listFeedbackForUser,
} from "@/lib/features/feedback/feedback-service";

export const GET = apiHandler("GET /api/v1/feedback", async () => {
  const userId = await requireAuth();
  const feedback = await listFeedbackForUser(userId);

  return NextResponse.json({ feedback });
});

export const POST = apiHandler("POST /api/v1/feedback", async (req: NextRequest) => {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = await parseAndValidateRequest(req, FeedbackCreateInputSchema);
  const feedback = await createFeedbackSubmission({
    userId: user.id,
    userEmail: user.email ?? null,
    userDisplayName:
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      null,
    input,
    requestUserAgent: req.headers.get("user-agent"),
  });

  return NextResponse.json({ feedback }, { status: 201 });
});
