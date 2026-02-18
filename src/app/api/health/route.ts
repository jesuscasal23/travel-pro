import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {
    anthropic: process.env.ANTHROPIC_API_KEY ? "ok" : "missing",
    supabase: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY ? "ok" : "missing",
    database: process.env.DATABASE_URL ? "ok" : "missing",
  };

  const healthy = Object.values(checks).every((s) => s === "ok");

  return NextResponse.json({ healthy, checks }, { status: healthy ? 200 : 207 });
}
