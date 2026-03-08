import { serializeProfileWithPace } from "@/lib/profile/pace";

export function serializeProfile<T extends { activityLevel?: string | null }>(profile: T) {
  return serializeProfileWithPace(profile);
}
