// ============================================================
// Travel Pro — Request Context (AsyncLocalStorage)
//
// Provides per-request storage for correlation IDs.
// Used by the logger to auto-include requestId in all log
// entries within an API request's call stack.
// ============================================================

import { AsyncLocalStorage } from "node:async_hooks";

interface RequestContext {
  requestId: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

/** Get the current request ID, or undefined if not in a request context. */
export function getRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}
