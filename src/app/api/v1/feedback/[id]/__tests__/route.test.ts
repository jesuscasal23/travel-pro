// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/core/supabase-server", () => ({
  getAuthenticatedUserId: vi.fn(),
}));

vi.mock("@/lib/features/feedback/feedback-service", () => ({
  getFeedbackByIdForUser: vi.fn(),
}));

vi.mock("@/lib/core/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock("@/lib/core/request-context", () => ({
  requestContext: {
    run: (_ctx: unknown, fn: () => unknown) => fn(),
  },
}));

import { FeedbackNotFoundError } from "@/lib/api/errors";
import { getAuthenticatedUserId } from "@/lib/core/supabase-server";
import { getFeedbackByIdForUser } from "@/lib/features/feedback/feedback-service";
import { GET } from "../route";

const mockGetAuthenticatedUserId = getAuthenticatedUserId as ReturnType<typeof vi.fn>;
const mockGetFeedbackByIdForUser = getFeedbackByIdForUser as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAuthenticatedUserId.mockResolvedValue("user-1");
  mockGetFeedbackByIdForUser.mockResolvedValue({ id: "feedback-1", title: "Offline mode" });
});

describe("GET /api/v1/feedback/:id", () => {
  it("returns the requested feedback item for the current user", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/feedback/feedback-1");
    const res = await GET(req, { params: Promise.resolve({ id: "feedback-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockGetFeedbackByIdForUser).toHaveBeenCalledWith("user-1", "feedback-1");
    expect(json.feedback.id).toBe("feedback-1");
  });

  it("returns 404 when the item is not visible to the current user", async () => {
    mockGetFeedbackByIdForUser.mockRejectedValueOnce(new FeedbackNotFoundError());

    const req = new NextRequest("http://localhost:3000/api/v1/feedback/feedback-1");
    const res = await GET(req, { params: Promise.resolve({ id: "feedback-1" }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("Feedback not found");
  });
});
