// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/core/supabase-server", () => ({
  getAuthenticatedUserId: vi.fn(),
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/features/feedback/feedback-service", () => ({
  listFeedbackForUser: vi.fn(),
  createFeedbackSubmission: vi.fn(),
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

import { getAuthenticatedUser, getAuthenticatedUserId } from "@/lib/core/supabase-server";
import {
  createFeedbackSubmission,
  listFeedbackForUser,
} from "@/lib/features/feedback/feedback-service";
import { GET, POST } from "../route";

const mockGetAuthenticatedUserId = getAuthenticatedUserId as ReturnType<typeof vi.fn>;
const mockGetAuthenticatedUser = getAuthenticatedUser as ReturnType<typeof vi.fn>;
const mockListFeedbackForUser = listFeedbackForUser as ReturnType<typeof vi.fn>;
const mockCreateFeedbackSubmission = createFeedbackSubmission as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAuthenticatedUserId.mockResolvedValue("user-1");
  mockGetAuthenticatedUser.mockResolvedValue({
    id: "user-1",
    email: "traveler@example.com",
    user_metadata: { full_name: "Traveler" },
  });
  mockListFeedbackForUser.mockResolvedValue([{ id: "feedback-1", title: "Offline mode" }]);
  mockCreateFeedbackSubmission.mockResolvedValue({ id: "feedback-1", title: "Offline mode" });
});

describe("GET /api/v1/feedback", () => {
  it("returns the current user's feedback", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/feedback");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockListFeedbackForUser).toHaveBeenCalledWith("user-1");
    expect(json.feedback).toEqual([{ id: "feedback-1", title: "Offline mode" }]);
  });

  it("rejects unauthenticated requests", async () => {
    mockGetAuthenticatedUserId.mockResolvedValueOnce(null);
    const req = new NextRequest("http://localhost:3000/api/v1/feedback");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });
});

describe("POST /api/v1/feedback", () => {
  it("creates feedback for an authenticated user", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "user-agent": "Mozilla/5.0 test",
      },
      body: JSON.stringify({
        category: "feature_request",
        title: "Offline mode",
        description: "I want a lightweight offline mode for saved itineraries.",
        sourceRoute: "/home",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(mockCreateFeedbackSubmission).toHaveBeenCalledWith({
      userId: "user-1",
      userEmail: "traveler@example.com",
      userDisplayName: "Traveler",
      input: {
        category: "feature_request",
        title: "Offline mode",
        description: "I want a lightweight offline mode for saved itineraries.",
        sourceRoute: "/home",
      },
      requestUserAgent: "Mozilla/5.0 test",
    });
    expect(json.feedback.id).toBe("feedback-1");
  });

  it("returns 400 for invalid payloads", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "feature_request",
        title: "Bad",
        description: "too short",
        sourceRoute: "/home",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Validation failed");
    expect(mockCreateFeedbackSubmission).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated submission attempts", async () => {
    mockGetAuthenticatedUser.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/v1/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "feature_request",
        title: "Offline mode",
        description: "I want a lightweight offline mode for saved itineraries.",
        sourceRoute: "/home",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });
});
