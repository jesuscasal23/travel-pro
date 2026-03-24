// ============================================================
// Travel Pro — POST /api/v1/trips/[id]/generate-activities
// Generate activities for a single city within an existing itinerary.
// ============================================================
import { apiHandler, assertTripAccess, parseAndValidateRequest } from "@/lib/api/helpers";
import { GenerateActivitiesInputSchema } from "@/lib/features/generation/schemas";
import { resolveTripUserProfile } from "@/lib/features/profile/profile-service";
import { generateActivitiesForCity } from "@/lib/features/trips/city-activity-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = apiHandler(
  "POST /api/v1/trips/:id/generate-activities",
  async (req, params) => {
    const tripAccess = await assertTripAccess(req, params.id, { requireTripOwner: true });
    if (!tripAccess) {
      throw new Error("Trip access unexpectedly missing for activity generation request");
    }

    const { profile: requestProfile, cityId } = await parseAndValidateRequest(
      req,
      GenerateActivitiesInputSchema
    );
    const profile = await resolveTripUserProfile(tripAccess.profileId, requestProfile);
    const itinerary = await generateActivitiesForCity({
      tripId: params.id,
      profile,
      cityId,
      signal: req.signal,
    });

    return Response.json({ itinerary });
  }
);
