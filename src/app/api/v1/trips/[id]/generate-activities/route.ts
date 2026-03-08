// ============================================================
// Travel Pro — POST /api/v1/trips/[id]/generate-activities
// Generate activities for a single city within an existing itinerary.
// ============================================================
import { apiHandler, assertTripAccess, parseAndValidateRequest } from "@/lib/api/helpers";
import { GenerateActivitiesInputSchema } from "@/lib/features/generation/schemas";
import { generateActivitiesForCity } from "@/lib/features/trips/city-activity-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = apiHandler(
  "POST /api/v1/trips/:id/generate-activities",
  async (req, params) => {
    await assertTripAccess(req, params.id, { requireTripOwner: true });

    const { profile, cityId } = await parseAndValidateRequest(req, GenerateActivitiesInputSchema);
    const itinerary = await generateActivitiesForCity({
      tripId: params.id,
      profile,
      cityId,
      signal: req.signal,
    });

    return Response.json({ itinerary });
  }
);
