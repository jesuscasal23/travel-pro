import type { ActivityPace } from "@/types";

type LegacyActivityLevel = "low" | "moderate" | "high";

const LEGACY_TO_PACE: Record<LegacyActivityLevel, ActivityPace> = {
  low: "relaxed",
  moderate: "moderate",
  high: "active",
};

function normalizeStoredPace(value: string | null | undefined): ActivityPace | undefined {
  if (!value) return undefined;
  if (value === "relaxed" || value === "moderate" || value === "active") {
    return value;
  }
  if (value === "low" || value === "high") {
    return LEGACY_TO_PACE[value];
  }
  return undefined;
}

export function resolvePaceInput(input: {
  pace?: ActivityPace;
  activityLevel?: string | null;
}): ActivityPace | undefined {
  if (input.pace) return input.pace;
  return normalizeStoredPace(input.activityLevel);
}

export function serializeProfileWithPace<
  T extends {
    activityLevel?: string | null;
  },
>(profile: T): Omit<T, "activityLevel"> & { pace?: ActivityPace } {
  const { activityLevel, ...rest } = profile;
  const pace = normalizeStoredPace(activityLevel);
  return pace ? { ...rest, pace } : rest;
}
