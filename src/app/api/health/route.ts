import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { status: string; detail?: string }> = {};

  // 1. Anthropic API key
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  checks.anthropic = anthropicKey
    ? { status: "ok", detail: `Key set (${anthropicKey.slice(0, 10)}...)` }
    : { status: "missing", detail: "ANTHROPIC_API_KEY not set" };

  // 2. Supabase config
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const sbService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  checks.supabase = sbUrl && sbAnon && sbService
    ? { status: "ok", detail: `URL: ${sbUrl}` }
    : {
        status: "partial",
        detail: [
          !sbUrl && "NEXT_PUBLIC_SUPABASE_URL missing",
          !sbAnon && "NEXT_PUBLIC_SUPABASE_ANON_KEY missing",
          !sbService && "SUPABASE_SERVICE_ROLE_KEY missing",
        ].filter(Boolean).join(", "),
      };

  // 3. Database URL
  const dbUrl = process.env.DATABASE_URL;
  checks.database = dbUrl
    ? { status: "ok", detail: `Host: ${dbUrl.split("@")[1]?.split("/")[0] ?? "set"}` }
    : { status: "missing", detail: "DATABASE_URL not set" };

  // 4. Test actual DB connection via Supabase REST
  if (sbUrl && sbService) {
    try {
      const res = await fetch(`${sbUrl}/rest/v1/`, {
        headers: {
          apikey: sbService,
          Authorization: `Bearer ${sbService}`,
        },
      });
      checks.supabase_connection = res.ok
        ? { status: "ok", detail: `REST API responded ${res.status}` }
        : { status: "error", detail: `REST API returned ${res.status}` };
    } catch (e) {
      checks.supabase_connection = {
        status: "error",
        detail: e instanceof Error ? e.message : "Connection failed",
      };
    }
  }

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json({ healthy: allOk, checks }, { status: allOk ? 200 : 207 });
}
