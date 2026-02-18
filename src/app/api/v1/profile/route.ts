// ============================================================
// Travel Pro — Profile API
// GET    /api/v1/profile        → fetch profile
// PATCH  /api/v1/profile        → update profile preferences
// DELETE /api/v1/profile        → delete account (GDPR)
// GET    /api/v1/profile/export → download profile data as JSON
// ============================================================

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  apiHandler,
  requireAuth,
  requireProfile,
  parseJsonBody,
  validateBody,
} from "@/lib/api/helpers";

const patchSchema = z.object({
  nationality: z.string().min(1).optional(),
  homeAirport: z.string().min(1).optional(),
  travelStyle: z.enum(["backpacker", "comfort", "luxury"]).optional(),
  interests: z.array(z.string()).optional(),
  activityLevel: z.enum(["low", "moderate", "high"]).optional(),
  languagesSpoken: z.array(z.string()).optional(),
  onboardingCompleted: z.boolean().optional(),
});

// ── GET /api/v1/profile ───────────────────────────────────────
export const GET = apiHandler("GET /api/v1/profile", async () => {
  const userId = await requireAuth();
  const profile = await requireProfile(userId);
  return NextResponse.json({ profile });
});

// ── PATCH /api/v1/profile ─────────────────────────────────────
export const PATCH = apiHandler("PATCH /api/v1/profile", async (req) => {
  const userId = await requireAuth();
  const body = await parseJsonBody(req);
  const data = validateBody(patchSchema, body);

  const profile = await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      nationality: data.nationality ?? "German",
      homeAirport: data.homeAirport ?? "",
      travelStyle: data.travelStyle ?? "comfort",
      interests: data.interests ?? [],
      activityLevel: data.activityLevel,
      languagesSpoken: data.languagesSpoken ?? [],
      onboardingCompleted: data.onboardingCompleted ?? false,
    },
    update: {
      ...(data.nationality && { nationality: data.nationality }),
      ...(data.homeAirport && { homeAirport: data.homeAirport }),
      ...(data.travelStyle && { travelStyle: data.travelStyle }),
      ...(data.interests && { interests: data.interests }),
      ...(data.activityLevel && { activityLevel: data.activityLevel }),
      ...(data.languagesSpoken && { languagesSpoken: data.languagesSpoken }),
      ...(data.onboardingCompleted !== undefined && {
        onboardingCompleted: data.onboardingCompleted,
      }),
    },
  });

  return NextResponse.json({ profile });
});

// ── DELETE /api/v1/profile ────────────────────────────────────
export const DELETE = apiHandler("DELETE /api/v1/profile", async () => {
  const userId = await requireAuth();

  // Cascade: profile → trips → itineraries (via Prisma cascade)
  await prisma.profile.deleteMany({ where: { userId } });

  // Delete the Supabase auth user (requires service role key)
  const cookieStore = await cookies();
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  await supabaseAdmin.auth.admin.deleteUser(userId);

  return NextResponse.json({ deleted: true });
});
