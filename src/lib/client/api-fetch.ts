import { parseApiErrorResponse, reportApiError } from "./api-error-reporting";

/**
 * Typed API error thrown by `apiFetch` / `apiFetchRaw` on non-ok responses.
 * Callers can catch this to branch on status (e.g. 404 → null).
 */
export class ApiError extends Error {
  status: number;
  requestId: string | null;
  responseBody?: unknown;

  constructor(message: string, status: number, requestId: string | null, responseBody?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.requestId = requestId;
    this.responseBody = responseBody;
  }
}

// Prevent multiple concurrent redirects when several API calls 401 at once
let isRedirectingToLogin = false;

/**
 * Redirect to login when API returns 401 (session expired).
 * Uses window.location so the full page reloads and clears stale client state.
 */
function handleSessionExpired(): void {
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;

  const currentPath = window.location.pathname + window.location.search;
  const loginUrl = `/login?next=${encodeURIComponent(currentPath)}&expired=1`;
  window.location.href = loginUrl;
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  /** Hook or component name — included in error reports for tracing. */
  source: string;
  /** Auto-serialized to JSON and sets Content-Type header. */
  body?: unknown;
  /** User-facing message when the request fails. */
  fallbackMessage?: string;
}

/**
 * Shared fetch wrapper for all client-side API calls.
 *
 * - Serializes `body` to JSON and sets `Content-Type` automatically.
 * - Reports network + HTTP errors to `/api/v1/client-errors`.
 * - Throws `ApiError` on non-ok responses (inspect `.status` for branching).
 * - Returns parsed JSON on success.
 */
export async function apiFetch<T>(endpoint: string, options: ApiFetchOptions): Promise<T> {
  const res = await apiFetchRaw(endpoint, options);
  return res.json();
}

/**
 * Like `apiFetch` but returns the raw `Response` instead of parsing JSON.
 * Use for streaming (SSE) endpoints or manual response handling.
 */
export async function apiFetchRaw(endpoint: string, options: ApiFetchOptions): Promise<Response> {
  const { source, body, fallbackMessage = "Request failed", ...init } = options;
  const method = init.method ?? "GET";

  const fetchInit: RequestInit = { ...init };
  if (body !== undefined) {
    fetchInit.headers = { "Content-Type": "application/json", ...fetchInit.headers };
    fetchInit.body = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(endpoint, fetchInit);
  } catch (error) {
    await reportApiError({
      source,
      endpoint,
      method,
      message: error instanceof Error ? error.message : "Network error",
    });
    throw new Error(fallbackMessage);
  }

  if (!res.ok) {
    // Session expired — redirect to login before processing the error further
    if (res.status === 401 && typeof window !== "undefined") {
      handleSessionExpired();
    }

    const parsed = await parseApiErrorResponse(res, fallbackMessage);
    await reportApiError({
      source,
      endpoint,
      method,
      message: parsed.message,
      status: parsed.status,
      requestId: parsed.requestId,
      responseBody: parsed.responseBody,
    });
    throw new ApiError(parsed.message, parsed.status, parsed.requestId, parsed.responseBody);
  }

  return res;
}
