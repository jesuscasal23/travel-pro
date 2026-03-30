import { NextRequest, NextResponse } from "next/server";
import { apiHandler, parseAndValidateRequest, requireSuperUser } from "@/lib/api/helpers";
import { FeedbackStatusUpdateInputSchema } from "@/lib/features/feedback/schemas";
import { publishFeedbackStatusUpdate } from "@/lib/features/feedback/feedback-service";

export const PATCH = apiHandler(
  "PATCH /api/v1/admin/feedback/:id",
  async (req: NextRequest, params) => {
    const { profileId } = await requireSuperUser();
    const input = await parseAndValidateRequest(req, FeedbackStatusUpdateInputSchema);
    const feedback = await publishFeedbackStatusUpdate({
      feedbackId: params.id,
      actorProfileId: profileId,
      input,
    });

    return NextResponse.json({ feedback });
  }
);
