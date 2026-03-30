// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/core/prisma", () => ({
  prisma: {
    profile: { findUnique: vi.fn() },
    trip: { findUnique: vi.fn() },
    feedbackSubmission: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    feedbackStatusUpdate: {
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/core/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock("@/lib/features/feedback/feedback-storage", () => ({
  uploadFeedbackScreenshot: vi.fn(),
  createFeedbackScreenshotSignedUrl: vi.fn(),
}));

vi.mock("@/lib/features/feedback/feedback-linear-service", () => ({
  createLinearFeedbackIssue: vi.fn(),
}));

vi.mock("@/lib/features/feedback/feedback-email-service", () => ({
  sendFeedbackStatusEmail: vi.fn(),
}));

import { prisma } from "@/lib/core/prisma";
import {
  createFeedbackSubmission,
  publishFeedbackStatusUpdate,
} from "@/lib/features/feedback/feedback-service";
import {
  uploadFeedbackScreenshot,
  createFeedbackScreenshotSignedUrl,
} from "@/lib/features/feedback/feedback-storage";
import { createLinearFeedbackIssue } from "@/lib/features/feedback/feedback-linear-service";
import { sendFeedbackStatusEmail } from "@/lib/features/feedback/feedback-email-service";

const mockPrisma = prisma as unknown as {
  profile: { findUnique: ReturnType<typeof vi.fn> };
  trip: { findUnique: ReturnType<typeof vi.fn> };
  feedbackSubmission: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  feedbackStatusUpdate: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

const mockUploadFeedbackScreenshot = uploadFeedbackScreenshot as ReturnType<typeof vi.fn>;
const mockCreateSignedUrl = createFeedbackScreenshotSignedUrl as ReturnType<typeof vi.fn>;
const mockCreateLinearFeedbackIssue = createLinearFeedbackIssue as ReturnType<typeof vi.fn>;
const mockSendFeedbackStatusEmail = sendFeedbackStatusEmail as ReturnType<typeof vi.fn>;

function makeFeedbackRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "feedback-1",
    userId: "user-1",
    profileId: "profile-1",
    tripId: null,
    userEmail: "traveler@example.com",
    userDisplayName: "Traveler",
    category: "feature_request",
    title: "Offline mode",
    description: "I want a lightweight offline mode for saved itineraries.",
    status: "received",
    sourceRoute: "/home",
    appVersion: "0.4.0",
    browserInfo: { userAgent: "Mozilla/5.0" },
    screenshotBucket: null,
    screenshotPath: null,
    screenshotFilename: null,
    screenshotContentType: null,
    screenshotSizeBytes: null,
    latestStaffNote: null,
    latestStaffUpdateAt: null,
    linearIssueId: null,
    linearIssueIdentifier: null,
    linearIssueUrl: null,
    createdAt: new Date("2026-03-30T12:00:00.000Z"),
    updatedAt: new Date("2026-03-30T12:00:00.000Z"),
    statusUpdates: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.profile.findUnique.mockResolvedValue({ id: "profile-1" });
  mockPrisma.trip.findUnique.mockResolvedValue(null);
  mockCreateSignedUrl.mockResolvedValue(null);
  mockCreateLinearFeedbackIssue.mockResolvedValue(null);
  mockUploadFeedbackScreenshot.mockResolvedValue({
    bucket: "feedback-screenshots",
    path: "user-1/feedback-1/screenshot.png",
    filename: "screenshot.png",
    contentType: "image/png",
    sizeBytes: 1234,
  });
  mockPrisma.feedbackSubmission.create.mockResolvedValue(makeFeedbackRow());
  mockPrisma.feedbackSubmission.update.mockResolvedValue(makeFeedbackRow());
  mockPrisma.feedbackSubmission.findUnique.mockResolvedValue(makeFeedbackRow());
  mockSendFeedbackStatusEmail.mockResolvedValue({ deliveryStatus: "sent" });
  mockPrisma.feedbackStatusUpdate.update.mockResolvedValue({});
  mockPrisma.$transaction.mockImplementation(async (callback) =>
    callback({
      feedbackStatusUpdate: {
        create: mockPrisma.feedbackStatusUpdate.create,
      },
      feedbackSubmission: {
        update: mockPrisma.feedbackSubmission.update,
      },
    })
  );
});

describe("createFeedbackSubmission", () => {
  it("persists context, screenshot metadata, and Linear linkage when creation succeeds", async () => {
    mockPrisma.trip.findUnique.mockResolvedValueOnce({
      id: "trip-1",
      profile: { userId: "user-1" },
    });
    mockCreateLinearFeedbackIssue.mockResolvedValueOnce({
      id: "linear-1",
      identifier: "TRA-200",
      url: "https://linear.app/travel-pro/issue/TRA-200",
    });
    mockCreateSignedUrl.mockResolvedValueOnce("https://signed-url.test/screenshot");
    mockPrisma.feedbackSubmission.create.mockResolvedValueOnce(
      makeFeedbackRow({
        tripId: "trip-1",
        screenshotBucket: "feedback-screenshots",
        screenshotPath: "user-1/feedback-1/screenshot.png",
        screenshotFilename: "screenshot.png",
        screenshotContentType: "image/png",
        screenshotSizeBytes: 1234,
      })
    );
    mockPrisma.feedbackSubmission.update.mockResolvedValueOnce(
      makeFeedbackRow({
        tripId: "trip-1",
        screenshotBucket: "feedback-screenshots",
        screenshotPath: "user-1/feedback-1/screenshot.png",
        screenshotFilename: "screenshot.png",
        screenshotContentType: "image/png",
        screenshotSizeBytes: 1234,
        linearIssueId: "linear-1",
        linearIssueIdentifier: "TRA-200",
        linearIssueUrl: "https://linear.app/travel-pro/issue/TRA-200",
      })
    );

    const result = await createFeedbackSubmission({
      userId: "user-1",
      userEmail: "traveler@example.com",
      userDisplayName: "Traveler",
      requestUserAgent: "Mozilla/5.0 test",
      input: {
        category: "feature_request",
        title: "Offline mode",
        description: "I want a lightweight offline mode for saved itineraries.",
        sourceRoute: "/trips/trip-1",
        tripId: "trip-1",
        browserInfo: {
          language: "en-US",
          timezone: "Europe/Berlin",
          platform: "MacIntel",
          viewport: { width: 390, height: 844 },
        },
        screenshot: {
          filename: "screenshot.png",
          contentType: "image/png",
          sizeBytes: 1234,
          base64Data: "ZmFrZQ==",
        },
      },
    });

    expect(mockUploadFeedbackScreenshot).toHaveBeenCalledTimes(1);
    expect(mockPrisma.feedbackSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          profileId: "profile-1",
          tripId: "trip-1",
          sourceRoute: "/trips/trip-1",
          screenshotFilename: "screenshot.png",
          browserInfo: expect.objectContaining({
            userAgent: "Mozilla/5.0 test",
            language: "en-US",
            timezone: "Europe/Berlin",
          }),
        }),
      })
    );
    expect(mockCreateLinearFeedbackIssue).toHaveBeenCalledTimes(1);
    expect(result.linearIssue?.identifier).toBe("TRA-200");
    expect(result.screenshot?.url).toBe("https://signed-url.test/screenshot");
  });

  it("keeps feedback creation successful when Linear issue creation fails", async () => {
    mockCreateLinearFeedbackIssue.mockRejectedValueOnce(new Error("Linear unavailable"));

    const result = await createFeedbackSubmission({
      userId: "user-1",
      userEmail: "traveler@example.com",
      userDisplayName: "Traveler",
      requestUserAgent: "Mozilla/5.0 test",
      input: {
        category: "bug_report",
        title: "Map jumps",
        description: "The trip map jumps to the wrong city when I open it.",
        sourceRoute: "/home",
      },
    });

    expect(mockPrisma.feedbackSubmission.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.feedbackSubmission.update).not.toHaveBeenCalled();
    expect(result.linearIssue).toBeNull();
  });
});

describe("publishFeedbackStatusUpdate", () => {
  it("updates the feedback, records the status update, and sends email", async () => {
    mockPrisma.feedbackStatusUpdate.create.mockResolvedValueOnce({
      id: "update-1",
      createdAt: new Date("2026-03-31T10:00:00.000Z"),
    });
    mockPrisma.feedbackSubmission.findUnique
      .mockResolvedValueOnce(makeFeedbackRow())
      .mockResolvedValueOnce(
        makeFeedbackRow({
          status: "planned",
          latestStaffNote: "We're planning this now.",
          latestStaffUpdateAt: new Date("2026-03-31T10:00:00.000Z"),
          statusUpdates: [
            {
              id: "update-1",
              status: "planned",
              staffNote: "We're planning this now.",
              emailDeliveryStatus: "sent",
              emailedAt: new Date("2026-03-31T10:01:00.000Z"),
              createdAt: new Date("2026-03-31T10:00:00.000Z"),
            },
          ],
        })
      );

    const result = await publishFeedbackStatusUpdate({
      feedbackId: "feedback-1",
      actorProfileId: "profile-admin",
      input: {
        status: "planned",
        staffNote: "We're planning this now.",
      },
    });

    expect(mockPrisma.feedbackStatusUpdate.create).toHaveBeenCalledWith({
      data: {
        feedbackId: "feedback-1",
        status: "planned",
        staffNote: "We're planning this now.",
        createdByProfileId: "profile-admin",
      },
    });
    expect(mockPrisma.feedbackSubmission.update).toHaveBeenCalledWith({
      where: { id: "feedback-1" },
      data: {
        status: "planned",
        latestStaffNote: "We're planning this now.",
        latestStaffUpdateAt: new Date("2026-03-31T10:00:00.000Z"),
      },
    });
    expect(mockSendFeedbackStatusEmail).toHaveBeenCalledWith({
      toEmail: "traveler@example.com",
      feedbackTitle: "Offline mode",
      feedbackStatus: "planned",
      staffNote: "We're planning this now.",
    });
    expect(mockPrisma.feedbackStatusUpdate.update).toHaveBeenCalledWith({
      where: { id: "update-1" },
      data: {
        emailDeliveryStatus: "sent",
        emailedAt: expect.any(Date),
        emailError: null,
      },
    });
    expect(result.status).toBe("planned");
    expect(result.latestStaffNote).toBe("We're planning this now.");
  });
});
