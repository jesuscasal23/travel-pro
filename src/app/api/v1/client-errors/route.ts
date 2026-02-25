import { NextResponse } from "next/server";
import { z } from "zod";
import { apiHandler, parseJsonBody, validateBody } from "@/lib/api/helpers";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/v1/client-errors");

const ClientErrorSchema = z.object({
  source: z.string().min(1).max(120),
  endpoint: z.string().min(1).max(240),
  method: z.string().min(1).max(16),
  message: z.string().min(1).max(2000),
  status: z.number().int().min(0).max(599).optional(),
  requestId: z.string().max(200).nullable().optional(),
  responseBody: z.unknown().optional(),
});

export const POST = apiHandler("POST /api/v1/client-errors", async (req) => {
  const body = await parseJsonBody(req);
  const payload = validateBody(ClientErrorSchema, body);

  log.error("Client API error reported", {
    ...payload,
    userAgent: req.headers.get("user-agent") ?? "unknown",
  });

  return NextResponse.json({ ok: true }, { status: 202 });
});
