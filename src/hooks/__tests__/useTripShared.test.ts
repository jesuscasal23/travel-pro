import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "@/lib/client/api-fetch";
import { fetchTrip } from "@/hooks/api/trips/shared";

vi.mock("@/lib/client/api-fetch", () => ({
  apiFetch: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    requestId: string | null;

    constructor(message: string, status: number, requestId: string | null) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.requestId = requestId;
    }
  },
}));

describe("fetchTrip", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for 404 responses", async () => {
    vi.mocked(apiFetch).mockRejectedValueOnce(new ApiError("Trip not found", 404, "req-1"));

    await expect(fetchTrip("trip-123")).resolves.toBeNull();
  });

  it("rethrows 403 responses", async () => {
    vi.mocked(apiFetch).mockRejectedValueOnce(new ApiError("Forbidden", 403, "req-2"));

    await expect(fetchTrip("trip-123")).rejects.toMatchObject({ status: 403 });
  });
});
