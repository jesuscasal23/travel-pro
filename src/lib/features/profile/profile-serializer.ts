import { serializeProfileWithPace } from "@/lib/profile/pace";
import { normalizeInterests } from "@/lib/profile/interests";

export function serializeProfile<T extends { activityLevel?: string | null; interests?: string[] }>(
  profile: T
) {
  const serialized = serializeProfileWithPace(profile);
  if (!("interests" in serialized) || !Array.isArray(serialized.interests)) {
    return serialized;
  }

  return {
    ...serialized,
    interests: normalizeInterests(serialized.interests),
  };
}
