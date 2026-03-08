import { createLogger } from "@/lib/logger";
import { z } from "zod";
import { ClientErrorReportSchema } from "./schema";

const log = createLogger("client-error-service");

export type ClientErrorReport = z.infer<typeof ClientErrorReportSchema>;

export async function recordClientErrorReport(payload: ClientErrorReport, userAgent: string) {
  log.error("Client API error reported", {
    ...payload,
    userAgent,
  });
}
