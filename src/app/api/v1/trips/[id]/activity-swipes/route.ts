import { apiHandler, assertTripAccess, parseAndValidateRequest } from "@/lib/api/helpers";
import { RecordActivitySwipeInputSchema } from "@/lib/features/trips/schemas";
import { recordActivitySwipe } from "@/lib/features/trips/activity-swipe-service";

export const dynamic = "force-dynamic";

export const POST = apiHandler("POST /api/v1/trips/:id/activity-swipes", async (req, params) => {
  const tripAccess = await assertTripAccess(req, params.id, { requireTripOwner: true });
  if (!tripAccess) {
    throw new Error("Trip access unexpectedly missing for activity swipe request");
  }

  const input = await parseAndValidateRequest(req, RecordActivitySwipeInputSchema);
  const result = await recordActivitySwipe({
    tripId: params.id,
    activityId: input.activityId,
    decision: input.decision,
    cityId: input.cityId,
  });

  return Response.json({
    ok: true,
    ...result,
  });
});
