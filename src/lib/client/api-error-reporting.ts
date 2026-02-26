interface ApiErrorReport {
  source: string;
  endpoint: string;
  method: string;
  message: string;
  status?: number;
  requestId?: string | null;
  responseBody?: unknown;
}

interface ParsedApiError {
  message: string;
  status: number;
  requestId: string | null;
  responseBody?: unknown;
}

function defaultMessageFromStatus(status: number): string {
  if (status === 429) return "Too many requests. Please try again later.";
  if (status >= 500) return "Server error. Please try again.";
  return "Request failed";
}

/**
 * Parse API error responses without throwing; used by frontend hooks
 * to both surface a useful message and report details to backend logs.
 */
export async function parseApiErrorResponse(
  res: Response,
  fallbackMessage: string
): Promise<ParsedApiError> {
  const headers =
    res.headers && typeof res.headers.get === "function" ? res.headers : new Headers();
  const status = typeof res.status === "number" ? res.status : 0;
  const requestId = headers.get("x-request-id");
  let responseBody: unknown;
  let message = fallbackMessage;

  try {
    const hasJson = typeof (res as { json?: unknown }).json === "function";
    const hasText = typeof (res as { text?: unknown }).text === "function";
    const contentType = headers.get("content-type") ?? "";

    if (hasJson || contentType.includes("application/json")) {
      responseBody = await res.json();
      if (
        responseBody &&
        typeof responseBody === "object" &&
        ("error" in responseBody || "message" in responseBody)
      ) {
        const maybeError =
          (responseBody as { message?: unknown; error?: unknown }).message ??
          (responseBody as { message?: unknown; error?: unknown }).error;
        if (typeof maybeError === "string" && maybeError.trim().length > 0) {
          message = maybeError;
        }
      }
    } else if (hasText) {
      const text = await res.text();
      if (text.trim().length > 0) {
        responseBody = { text };
      }
    }
  } catch {
    // Ignore body parse errors and fall back to defaults.
  }

  if (message === fallbackMessage && status > 0) {
    message = `${fallbackMessage} (${status})`;
  }
  if (!message || message.trim().length === 0) {
    message = defaultMessageFromStatus(res.status);
  }

  return {
    message,
    status,
    requestId,
    responseBody,
  };
}

/**
 * Fire-and-forget client API error reporting to backend logs.
 * Never throws to avoid masking original frontend failures.
 */
export async function reportApiError(report: ApiErrorReport): Promise<void> {
  try {
    await fetch("/api/v1/client-errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
      keepalive: true,
    });
  } catch {
    // Swallow logging failures.
  }
}
