import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/core/prisma";
import { getSupabaseAdminEnv } from "@/lib/config/server-env";
import { BadRequestError, ProfileNotFoundError } from "@/lib/api/errors";
import { normalizeInterests } from "@/lib/features/profile/interests";
import { resolvePaceInput } from "@/lib/features/profile/pace";
import {
  toTravelerPreferences,
  toTravelerProfile,
} from "@/lib/features/profile/traveler-preferences";
import type { UserProfile } from "@/types";
import { z } from "zod";
import { PROFILE_EXPORT_INCLUDE } from "./query-shapes";
import { ProfilePatchInputSchema } from "./schemas";

type ProfilePatchInput = z.infer<typeof ProfilePatchInputSchema>;

export async function getProfileByUserId(userId: string) {
  const profile = await findProfileByUserId(userId);
  if (!profile) {
    throw new ProfileNotFoundError({ userId });
  }
  return profile;
}

export async function findProfileByUserId(userId: string) {
  return prisma.profile.findUnique({ where: { userId } });
}

export async function findProfileById(profileId: string) {
  return prisma.profile.findUnique({ where: { id: profileId } });
}

export async function saveProfile(userId: string, data: ProfilePatchInput) {
  const pace = resolvePaceInput(data);
  const interests = normalizeInterests(data.interests);

  return prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      nationality: data.nationality ?? "German",
      homeAirport: data.homeAirport ?? "",
      travelStyle: data.travelStyle ?? "smart-budget",
      interests,
      activityLevel: pace,
      vibes: data.vibes ?? undefined,
      languagesSpoken: data.languagesSpoken ?? [],
      onboardingCompleted: data.onboardingCompleted ?? false,
    },
    update: {
      ...(data.nationality && { nationality: data.nationality }),
      ...(data.homeAirport && { homeAirport: data.homeAirport }),
      ...(data.travelStyle && { travelStyle: data.travelStyle }),
      ...(data.interests && { interests }),
      ...(pace && { activityLevel: pace }),
      ...(data.vibes && { vibes: data.vibes }),
      ...(data.languagesSpoken && { languagesSpoken: data.languagesSpoken }),
      ...(data.onboardingCompleted !== undefined && {
        onboardingCompleted: data.onboardingCompleted,
      }),
      ...(data.lastSeenAppVersion && {
        lastSeenAppVersion: data.lastSeenAppVersion,
      }),
    },
  });
}

export async function deleteUserProfileAndAccount(userId: string) {
  await prisma.$transaction(async (tx) => {
    const profile = await tx.profile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (profile) {
      const trips = await tx.trip.findMany({
        where: { profileId: profile.id },
        select: { id: true },
      });
      const tripIds = trips.map((trip) => trip.id);

      if (tripIds.length > 0) {
        await tx.affiliateClick.deleteMany({
          where: { tripId: { in: tripIds } },
        });
      }

      await tx.trip.deleteMany({ where: { profileId: profile.id } });
    }

    await tx.profile.deleteMany({ where: { userId } });
  });

  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  const cookieStore = await cookies();
  const supabaseAdmin = createServerClient(url, serviceRoleKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  });

  await supabaseAdmin.auth.admin.deleteUser(userId);
}

export async function exportProfileData(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: PROFILE_EXPORT_INCLUDE,
  });

  if (!profile) {
    throw new ProfileNotFoundError({ userId });
  }

  return profile;
}

export async function resolveTripUserProfile(
  tripProfileId: string | null,
  fallbackProfile?: UserProfile
): Promise<UserProfile> {
  if (!tripProfileId) {
    if (!fallbackProfile) {
      throw new BadRequestError("Guest trip generation requires profile details");
    }
    return fallbackProfile;
  }

  const profile = await findProfileById(tripProfileId);
  if (!profile) {
    throw new ProfileNotFoundError({ profileId: tripProfileId });
  }

  return toTravelerProfile(
    toTravelerPreferences({
      nationality: profile.nationality,
      homeAirport: profile.homeAirport,
      travelStyle: profile.travelStyle as UserProfile["travelStyle"],
      interests: profile.interests,
      activityLevel: profile.activityLevel,
      vibes: (profile.vibes as UserProfile["vibes"]) ?? undefined,
      onboardingCompleted: profile.onboardingCompleted,
      languagesSpoken: profile.languagesSpoken,
    })
  );
}
