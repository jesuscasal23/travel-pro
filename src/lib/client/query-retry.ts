import { ApiError } from "@/lib/client/api-fetch";

export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (failureCount >= 2) return false;
  if (!(error instanceof ApiError)) return true;
  if (error.status === 401 || error.status === 403 || error.status === 404) return false;
  return error.status === 429 || error.status >= 500;
}
