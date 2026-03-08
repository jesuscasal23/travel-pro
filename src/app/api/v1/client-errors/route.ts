import { NextResponse } from "next/server";
import { apiHandler, parseAndValidateRequest } from "@/lib/api/helpers";
import { ClientErrorReportSchema } from "@/lib/features/client-errors/schema";
import { recordClientErrorReport } from "@/lib/features/client-errors/service";

export const POST = apiHandler("POST /api/v1/client-errors", async (req) => {
  const payload = await parseAndValidateRequest(req, ClientErrorReportSchema);
  await recordClientErrorReport(payload, req.headers.get("user-agent") ?? "unknown");

  return NextResponse.json({ ok: true }, { status: 202 });
});
