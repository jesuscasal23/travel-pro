import { apiHandler, assertTripAccess, parseAndValidateRequest } from "@/lib/api/helpers";
import { resolveTripUserProfile } from "@/lib/features/profile/profile-service";
import { DiscoverActivitiesInputSchema } from "@/lib/features/trips/schemas";
import { discoverActivitiesBatch } from "@/lib/features/trips/discover-activities-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = apiHandler(
  "POST /api/v1/trips/:id/discover-activities",
  async (req, params) => {
    const tripAccess = await assertTripAccess(req, params.id, { requireTripOwner: true });
    if (!tripAccess) {
      throw new Error("Trip access unexpectedly missing for discover activities request");
    }

    const {
      profile: requestProfile,
      cityId,
      batchIndex,
    } = await parseAndValidateRequest(req, DiscoverActivitiesInputSchema);
    const profile = await resolveTripUserProfile(tripAccess.profileId, requestProfile);
    const activities = await discoverActivitiesBatch({
      tripId: params.id,
      profile,
      cityId,
      batchIndex,
      signal: req.signal,
    });

    return Response.json({ activities });
  }
);
