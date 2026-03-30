// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api/helpers", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/helpers")>("@/lib/api/helpers");
  return {
    ...actual,
    requireSuperUser: vi.fn(),
  };
});

vi.mock("@/lib/features/feedback/feedback-service", () => ({
  publishFeedbackStatusUpdate: vi.fn(),
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

import { ForbiddenError } from "@/lib/api/errors";
import { requireSuperUser } from "@/lib/api/helpers";
import { publishFeedbackStatusUpdate } from "@/lib/features/feedback/feedback-service";
import { PATCH } from "../route";

const mockRequireSuperUser = requireSuperUser as ReturnType<typeof vi.fn>;
const mockPublishFeedbackStatusUpdate = publishFeedbackStatusUpdate as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireSuperUser.mockResolvedValue({ userId: "user-admin", profileId: "profile-admin" });
  mockPublishFeedbackStatusUpdate.mockResolvedValue({ id: "feedback-1", status: "planned" });
});

describe("PATCH /api/v1/admin/feedback/:id", () => {
  it("publishes a user-facing status update for superusers", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/admin/feedback/feedback-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "planned",
        staffNote: "We're planning this now.",
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "feedback-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockPublishFeedbackStatusUpdate).toHaveBeenCalledWith({
      feedbackId: "feedback-1",
      actorProfileId: "profile-admin",
      input: {
        status: "planned",
        staffNote: "We're planning this now.",
      },
    });
    expect(json.feedback.status).toBe("planned");
  });

  it("returns 403 when the caller is not a superuser", async () => {
    mockRequireSuperUser.mockRejectedValueOnce(new ForbiddenError("Forbidden"));

    const req = new NextRequest("http://localhost:3000/api/v1/admin/feedback/feedback-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "planned" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "feedback-1" }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toBe("Forbidden");
  });
});
