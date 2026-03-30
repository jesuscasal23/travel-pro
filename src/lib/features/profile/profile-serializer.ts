import { serializeProfileWithPace } from "@/lib/features/profile/pace";
import { normalizeInterests } from "@/lib/features/profile/interests";

export function serializeProfile<T extends { activityLevel?: string; interests?: string[] }>(
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
