import { z } from "zod";

export const ClientErrorReportSchema = z.object({
  source: z.string().min(1).max(120),
  endpoint: z.string().min(1).max(240),
  method: z.string().min(1).max(16),
  message: z.string().min(1).max(2000),
  status: z.number().int().min(0).max(599).optional(),
  requestId: z.string().max(200).nullable().optional(),
  responseBody: z.unknown().optional(),
});
