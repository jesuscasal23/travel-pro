import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/db/prisma";
import { getSupabaseAdminEnv } from "@/lib/config/server-env";
import { ProfileNotFoundError } from "@/lib/api/errors";
import { resolvePaceInput } from "@/lib/profile/pace";
import { z } from "zod";
import { PROFILE_EXPORT_INCLUDE } from "./query-shapes";
import { ProfilePatchInputSchema } from "./schemas";

export type ProfilePatchInput = z.infer<typeof ProfilePatchInputSchema>;

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

export async function saveProfile(userId: string, data: ProfilePatchInput) {
  const pace = resolvePaceInput(data);

  return prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      nationality: data.nationality ?? "German",
      homeAirport: data.homeAirport ?? "",
      travelStyle: data.travelStyle ?? "comfort",
      interests: data.interests ?? [],
      activityLevel: pace,
      languagesSpoken: data.languagesSpoken ?? [],
      onboardingCompleted: data.onboardingCompleted ?? false,
    },
    update: {
      ...(data.nationality && { nationality: data.nationality }),
      ...(data.homeAirport && { homeAirport: data.homeAirport }),
      ...(data.travelStyle && { travelStyle: data.travelStyle }),
      ...(data.interests && { interests: data.interests }),
      ...(pace && { activityLevel: pace }),
      ...(data.languagesSpoken && { languagesSpoken: data.languagesSpoken }),
      ...(data.onboardingCompleted !== undefined && {
        onboardingCompleted: data.onboardingCompleted,
      }),
    },
  });
}

export async function deleteUserProfileAndAccount(userId: string) {
  await prisma.profile.deleteMany({ where: { userId } });

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
