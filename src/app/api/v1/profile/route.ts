// ============================================================
// Fichi — Profile API
// GET    /api/v1/profile        → fetch profile
// PATCH  /api/v1/profile        → update profile preferences
// DELETE /api/v1/profile        → delete account (GDPR)
// GET    /api/v1/profile/export → download profile data as JSON
// ============================================================

import { NextResponse } from "next/server";
import { apiHandler, parseAndValidateRequest, requireAuth } from "@/lib/api/helpers";
import { ProfilePatchInputSchema } from "@/lib/features/profile/schemas";
import {
  deleteUserProfileAndAccount,
  getProfileByUserId,
  saveProfile,
} from "@/lib/features/profile/profile-service";
import { serializeProfile } from "@/lib/features/profile/profile-serializer";

// ── GET /api/v1/profile ───────────────────────────────────────
export const GET = apiHandler("GET /api/v1/profile", async () => {
  const userId = await requireAuth();
  const profile = await getProfileByUserId(userId);
  return NextResponse.json({ profile: serializeProfile(profile) });
});

// ── PATCH /api/v1/profile ─────────────────────────────────────
export const PATCH = apiHandler("PATCH /api/v1/profile", async (req) => {
  const userId = await requireAuth();
  const data = await parseAndValidateRequest(req, ProfilePatchInputSchema);
  const profile = await saveProfile(userId, data);

  return NextResponse.json({ profile: serializeProfile(profile) });
});

// ── DELETE /api/v1/profile ────────────────────────────────────
export const DELETE = apiHandler("DELETE /api/v1/profile", async () => {
  const userId = await requireAuth();
  await deleteUserProfileAndAccount(userId);
  return NextResponse.json({ deleted: true });
});
