import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/core/prisma";
import { createLogger } from "@/lib/core/logger";
import { currentAppVersion } from "@/data/changelog";
import {
  BadRequestError,
  FeedbackNotFoundError,
  ForbiddenError,
} from "@/lib/api/errors";
import { parsePaginationParams, paginationMeta } from "@/lib/api/pagination";
import { serializeFeedbackSubmission } from "./feedback-serializer";
import { uploadFeedbackScreenshot, createFeedbackScreenshotSignedUrl } from "./feedback-storage";
import { createLinearFeedbackIssue } from "./feedback-linear-service";
import { sendFeedbackStatusEmail } from "./feedback-email-service";
import type {
  FeedbackBrowserInfoSchema,
  FeedbackCreateInputSchema,
  FeedbackStatusUpdateInputSchema,
} from "./schemas";
import type { z } from "zod";

type FeedbackCreateInput = z.infer<typeof FeedbackCreateInputSchema>;
type FeedbackStatusUpdateInput = z.infer<typeof FeedbackStatusUpdateInputSchema>;
type FeedbackBrowserInfo = z.infer<typeof FeedbackBrowserInfoSchema>;

const log = createLogger("feedback-service");

const FEEDBACK_WITH_LATEST_UPDATE_INCLUDE = {
  statusUpdates: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
} satisfies Prisma.FeedbackSubmissionInclude;

type FeedbackRecord = Prisma.FeedbackSubmissionGetPayload<{
  include: typeof FEEDBACK_WITH_LATEST_UPDATE_INCLUDE;
}>;

function cleanString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeBrowserInfo(
  browserInfo: FeedbackBrowserInfo,
  requestUserAgent: string | null
): Prisma.InputJsonValue | undefined {
  const normalized: Prisma.JsonObject = {};

  const userAgent = cleanString(browserInfo?.userAgent) ?? cleanString(requestUserAgent);
  const language = cleanString(browserInfo?.language);
  const timezone = cleanString(browserInfo?.timezone);
  const platform = cleanString(browserInfo?.platform);

  if (userAgent) normalized.userAgent = userAgent;
  if (language) normalized.language = language;
  if (timezone) normalized.timezone = timezone;
  if (platform) normalized.platform = platform;
  if (browserInfo?.viewport) {
    normalized.viewport = browserInfo.viewport;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function resolveAppVersion() {
  const buildTimestamp = cleanString(process.env.NEXT_PUBLIC_BUILD_TIMESTAMP);
  return buildTimestamp ? `${currentAppVersion}+${buildTimestamp}` : currentAppVersion;
}

async function resolveOptionalProfileId(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });

  return profile?.id ?? null;
}

async function resolveOwnedTripId(userId: string, tripId: string | null | undefined) {
  if (!tripId) {
    return null;
  }

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: {
      id: true,
      profile: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!trip || trip.profile?.userId !== userId) {
    throw new BadRequestError("Trip not found for feedback context");
  }

  return trip.id;
}

async function serializeFeedbackRecord(row: FeedbackRecord) {
  const screenshotUrl = await createFeedbackScreenshotSignedUrl({
    bucket: row.screenshotBucket,
    path: row.screenshotPath,
  });

  return serializeFeedbackSubmission(row, { screenshotUrl });
}

async function getFeedbackRecordById(feedbackId: string) {
  const row = await prisma.feedbackSubmission.findUnique({
    where: { id: feedbackId },
    include: FEEDBACK_WITH_LATEST_UPDATE_INCLUDE,
  });

  if (!row) {
    throw new FeedbackNotFoundError({ feedbackId });
  }

  return row;
}

export async function createFeedbackSubmission(params: {
  userId: string;
  userEmail: string | null;
  userDisplayName: string | null;
  input: FeedbackCreateInput;
  requestUserAgent: string | null;
}) {
  const feedbackId = crypto.randomUUID();
  const [profileId, tripId] = await Promise.all([
    resolveOptionalProfileId(params.userId),
    resolveOwnedTripId(params.userId, params.input.tripId ?? null),
  ]);
  const browserInfo = normalizeBrowserInfo(params.input.browserInfo, params.requestUserAgent);

  const uploadedScreenshot = params.input.screenshot
    ? await uploadFeedbackScreenshot({
        feedbackId,
        userId: params.userId,
        screenshot: params.input.screenshot,
      })
    : null;

  let row = await prisma.feedbackSubmission.create({
    data: {
      id: feedbackId,
      userId: params.userId,
      profileId,
      tripId,
      userEmail: cleanString(params.userEmail) ?? null,
      userDisplayName: cleanString(params.userDisplayName) ?? null,
      category: params.input.category,
      title: params.input.title,
      description: params.input.description,
      sourceRoute: params.input.sourceRoute,
      appVersion: resolveAppVersion(),
      ...(browserInfo ? { browserInfo } : {}),
      ...(uploadedScreenshot
        ? {
            screenshotBucket: uploadedScreenshot.bucket,
            screenshotPath: uploadedScreenshot.path,
            screenshotFilename: uploadedScreenshot.filename,
            screenshotContentType: uploadedScreenshot.contentType,
            screenshotSizeBytes: uploadedScreenshot.sizeBytes,
          }
        : {}),
    },
    include: FEEDBACK_WITH_LATEST_UPDATE_INCLUDE,
  });

  try {
    const linearIssue = await createLinearFeedbackIssue({
      feedbackId,
      category: params.input.category,
      title: params.input.title,
      description: params.input.description,
      userId: params.userId,
      userEmail: cleanString(params.userEmail) ?? null,
      userDisplayName: cleanString(params.userDisplayName) ?? null,
      sourceRoute: params.input.sourceRoute,
      appVersion: row.appVersion,
      tripId,
      browserInfo: browserInfo ?? null,
      hasScreenshot: Boolean(uploadedScreenshot),
    });

    if (linearIssue) {
      row = await prisma.feedbackSubmission.update({
        where: { id: feedbackId },
        data: {
          linearIssueId: linearIssue.id,
          linearIssueIdentifier: linearIssue.identifier,
          linearIssueUrl: linearIssue.url,
        },
        include: FEEDBACK_WITH_LATEST_UPDATE_INCLUDE,
      });
    }
  } catch (error) {
    log.warn("Failed to create Linear issue for feedback", {
      feedbackId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return serializeFeedbackRecord(row);
}

export async function listFeedbackForUser(userId: string) {
  const rows = await prisma.feedbackSubmission.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: FEEDBACK_WITH_LATEST_UPDATE_INCLUDE,
  });

  return Promise.all(rows.map((row) => serializeFeedbackRecord(row)));
}

export async function getFeedbackByIdForUser(userId: string, feedbackId: string) {
  const row = await getFeedbackRecordById(feedbackId);
  if (row.userId !== userId) {
    throw new FeedbackNotFoundError({ feedbackId, userId });
  }

  return serializeFeedbackRecord(row);
}

export async function publishFeedbackStatusUpdate(params: {
  feedbackId: string;
  actorProfileId: string;
  input: FeedbackStatusUpdateInput;
}) {
  const feedback = await getFeedbackRecordById(params.feedbackId);

  if (!params.actorProfileId) {
    throw new ForbiddenError("Forbidden");
  }

  const statusUpdate = await prisma.$transaction(async (tx) => {
    const created = await tx.feedbackStatusUpdate.create({
      data: {
        feedbackId: params.feedbackId,
        status: params.input.status,
        staffNote: params.input.staffNote ?? null,
        createdByProfileId: params.actorProfileId,
      },
    });

    await tx.feedbackSubmission.update({
      where: { id: params.feedbackId },
      data: {
        status: params.input.status,
        latestStaffNote: params.input.staffNote ?? null,
        latestStaffUpdateAt: created.createdAt,
      },
    });

    return created;
  });

  const emailResult = await sendFeedbackStatusEmail({
    toEmail: feedback.userEmail,
    feedbackTitle: feedback.title,
    feedbackStatus: params.input.status,
    staffNote: params.input.staffNote,
  });

  await prisma.feedbackStatusUpdate.update({
    where: { id: statusUpdate.id },
    data:
      emailResult.deliveryStatus === "sent"
        ? {
            emailDeliveryStatus: "sent",
            emailedAt: new Date(),
            emailError: null,
          }
        : {
            emailDeliveryStatus: emailResult.deliveryStatus,
            emailError: emailResult.error?.slice(0, 2_000) ?? null,
          },
  });

  return getFeedbackRecordById(params.feedbackId).then((row) => serializeFeedbackRecord(row));
}

export async function listFeedbackForAdmin(url: URL) {
  const { page, limit, search } = parsePaginationParams(url);

  const where = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
          { userEmail: { contains: search, mode: "insensitive" as const } },
          { linearIssueIdentifier: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    prisma.feedbackSubmission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: FEEDBACK_WITH_LATEST_UPDATE_INCLUDE,
    }),
    prisma.feedbackSubmission.count({ where }),
  ]);

  const feedback = await Promise.all(
    rows.map(async (row) => ({
      ...(await serializeFeedbackRecord(row)),
      userEmail: row.userEmail,
      userDisplayName: row.userDisplayName,
      userId: row.userId,
    }))
  );

  return {
    feedback,
    ...paginationMeta(total, page, limit),
  };
}
