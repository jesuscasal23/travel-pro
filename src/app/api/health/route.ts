import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/helpers";

export const dynamic = "force-dynamic";

export const GET = apiHandler("GET /api/health", async () => {
  const checks: Record<string, string> = {
    anthropic: process.env.ANTHROPIC_API_KEY ? "ok" : "missing",
    supabase:
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
        ? "ok"
        : "missing",
    database: process.env.DATABASE_URL ? "ok" : "missing",
    redis:
      process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? "ok" : "missing",
  };

  // Optionally ping Redis to verify connectivity (not just env vars)
  if (checks.redis === "ok") {
    try {
      const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) checks.redis = "unreachable";
    } catch {
      checks.redis = "unreachable";
    }
  }

  const healthy = Object.values(checks).every((s) => s === "ok");

  return NextResponse.json({ healthy, checks }, { status: healthy ? 200 : 207 });
});
