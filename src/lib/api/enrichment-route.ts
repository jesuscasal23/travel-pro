import { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import { apiHandler, parseAndValidateRequest, requireAuth } from "./helpers";

/**
 * Factory for enrichment API routes.
 * All three enrichment endpoints follow the same pattern:
 *   require auth -> parse input -> call service -> return JSON.
 */
export function createEnrichmentRoute<T, TResult>(
  routeName: string,
  schema: z.ZodType<T>,
  handler: (input: T) => Promise<TResult>,
  resultKey: string
) {
  return apiHandler(routeName, async (req: NextRequest) => {
    await requireAuth();
    const input = await parseAndValidateRequest(req, schema);
    const result = await handler(input);
    return NextResponse.json({ [resultKey]: result });
  });
}
