import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/client/api-fetch";
import { shouldRetryQuery } from "@/lib/client/query-retry";

describe("shouldRetryQuery", () => {
  it("retries rate limits and server errors", () => {
    expect(shouldRetryQuery(0, new ApiError("Too many requests", 429, "req-1"))).toBe(true);
    expect(shouldRetryQuery(0, new ApiError("Server error", 503, "req-2"))).toBe(true);
  });

  it("does not retry auth or missing-resource errors", () => {
    expect(shouldRetryQuery(0, new ApiError("Unauthorized", 401, "req-1"))).toBe(false);
    expect(shouldRetryQuery(0, new ApiError("Forbidden", 403, "req-2"))).toBe(false);
    expect(shouldRetryQuery(0, new ApiError("Not found", 404, "req-3"))).toBe(false);
  });

  it("caps retries after the second failure", () => {
    expect(shouldRetryQuery(2, new ApiError("Server error", 500, "req-4"))).toBe(false);
  });
});
