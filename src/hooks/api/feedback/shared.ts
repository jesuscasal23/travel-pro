import { apiFetch } from "@/lib/client/api-fetch";

export interface FeedbackBrowserInfo {
  userAgent?: string;
  language?: string;
  timezone?: string;
  platform?: string;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface FeedbackScreenshotInput {
  filename: string;
  contentType: "image/png" | "image/jpeg" | "image/webp";
  sizeBytes: number;
  base64Data: string;
}

export interface FeedbackItem {
  id: string;
  category: "feature_request" | "bug_report" | "general_feedback" | "something_i_love";
  categoryLabel: string;
  title: string;
  description: string;
  status: "received" | "under_review" | "planned" | "shipped" | "not_now";
  statusLabel: string;
  sourceRoute: string;
  tripId: string | null;
  appVersion: string;
  browserInfo: unknown;
  createdAt: string;
  updatedAt: string;
  latestStaffNote: string | null;
  latestStaffUpdateAt: string | null;
  screenshot: {
    filename: string | null;
    contentType: string | null;
    sizeBytes: number | null;
    url: string | null;
  } | null;
  linearIssue: {
    identifier: string | null;
    url: string | null;
  } | null;
  latestUpdate: {
    id: string;
    status: FeedbackItem["status"];
    statusLabel: string;
    staffNote: string | null;
    createdAt: string;
    emailDeliveryStatus: string | null;
    emailedAt: string | null;
  } | null;
}

export interface CreateFeedbackPayload {
  category: FeedbackItem["category"];
  title: string;
  description: string;
  sourceRoute: string;
  tripId?: string | null;
  browserInfo?: FeedbackBrowserInfo;
  screenshot?: FeedbackScreenshotInput;
}

export async function fetchFeedbackList(): Promise<FeedbackItem[]> {
  const data = await apiFetch<{ feedback?: FeedbackItem[] }>("/api/v1/feedback", {
    source: "useFeedback",
    fallbackMessage: "Failed to load your feedback",
  });

  return data.feedback ?? [];
}

export async function createFeedback(payload: CreateFeedbackPayload): Promise<FeedbackItem> {
  const data = await apiFetch<{ feedback: FeedbackItem }>("/api/v1/feedback", {
    source: "useCreateFeedback",
    method: "POST",
    body: payload,
    fallbackMessage: "Failed to send feedback",
  });

  return data.feedback;
}
