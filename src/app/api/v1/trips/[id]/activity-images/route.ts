import { apiHandler, assertTripAccess, parseAndValidateRequest } from "@/lib/api/helpers";
import { z } from "zod";
import { resolveActivityImagesBatch } from "@/lib/features/trips/activity-image-service";

export const dynamic = "force-dynamic";

const ActivityImagesInputSchema = z.object({
  activityIds: z.array(z.string().min(1)).min(1).max(30),
});

export const POST = apiHandler("POST /api/v1/trips/:id/activity-images", async (req, params) => {
  await assertTripAccess(req, params.id, { requireTripOwner: true });

  const { activityIds } = await parseAndValidateRequest(req, ActivityImagesInputSchema);
  const images = await resolveActivityImagesBatch(activityIds);

  return Response.json({ images });
});
