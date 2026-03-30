import type { Prisma } from "@prisma/client";
import {
  getFeedbackCategoryLabel,
  getFeedbackStatusLabel,
  type FeedbackCategory,
  type FeedbackStatus,
} from "./constants";

export function serializeFeedbackSubmission(
  row: {
    id: string;
    category: string;
    title: string;
    description: string;
    status: string;
    sourceRoute: string;
    tripId: string | null;
    appVersion: string;
    latestStaffNote: string | null;
    latestStaffUpdateAt: Date | null;
    linearIssueIdentifier: string | null;
    linearIssueUrl: string | null;
    screenshotFilename: string | null;
    screenshotContentType: string | null;
    screenshotSizeBytes: number | null;
    createdAt: Date;
    updatedAt: Date;
    browserInfo?: Prisma.JsonValue | null;
    statusUpdates?: Array<{
      id: string;
      status: string;
      staffNote: string | null;
      createdAt: Date;
      emailDeliveryStatus?: string | null;
      emailedAt?: Date | null;
    }>;
  },
  options?: { screenshotUrl?: string | null }
) {
  const latestUpdate = row.statusUpdates?.[0];

  return {
    id: row.id,
    category: row.category as FeedbackCategory,
    categoryLabel: getFeedbackCategoryLabel(row.category as FeedbackCategory),
    title: row.title,
    description: row.description,
    status: row.status as FeedbackStatus,
    statusLabel: getFeedbackStatusLabel(row.status as FeedbackStatus),
    sourceRoute: row.sourceRoute,
    tripId: row.tripId,
    appVersion: row.appVersion,
    browserInfo: row.browserInfo ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    latestStaffNote: row.latestStaffNote,
    latestStaffUpdateAt: row.latestStaffUpdateAt?.toISOString() ?? null,
    screenshot:
      row.screenshotFilename || options?.screenshotUrl
        ? {
            filename: row.screenshotFilename,
            contentType: row.screenshotContentType,
            sizeBytes: row.screenshotSizeBytes,
            url: options?.screenshotUrl ?? null,
          }
        : null,
    linearIssue:
      row.linearIssueIdentifier || row.linearIssueUrl
        ? {
            identifier: row.linearIssueIdentifier,
            url: row.linearIssueUrl,
          }
        : null,
    latestUpdate: latestUpdate
      ? {
          id: latestUpdate.id,
          status: latestUpdate.status as FeedbackStatus,
          statusLabel: getFeedbackStatusLabel(latestUpdate.status as FeedbackStatus),
          staffNote: latestUpdate.staffNote,
          createdAt: latestUpdate.createdAt.toISOString(),
          emailDeliveryStatus: latestUpdate.emailDeliveryStatus ?? null,
          emailedAt: latestUpdate.emailedAt?.toISOString() ?? null,
        }
      : null,
  };
}
