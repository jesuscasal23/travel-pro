// ============================================================
// Travel Pro — Profile API
// GET    /api/v1/profile        → fetch profile
// PATCH  /api/v1/profile        → update profile preferences
// DELETE /api/v1/profile        → delete account (GDPR)
// GET    /api/v1/profile/export → download profile data as JSON
// ============================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server component — ignore
          }
        },
      },
    }
  );
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

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
export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

// ── PATCH /api/v1/profile ─────────────────────────────────────
export async function PATCH(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const data = parsed.data;

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
}

// ── DELETE /api/v1/profile ────────────────────────────────────
export async function DELETE() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
}
