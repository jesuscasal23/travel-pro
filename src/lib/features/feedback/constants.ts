export const FEEDBACK_CATEGORIES = [
  "feature_request",
  "bug_report",
  "general_feedback",
  "something_i_love",
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  feature_request: "Feature request",
  bug_report: "Bug report",
  general_feedback: "General feedback",
  something_i_love: "Something I love",
};

export const FEEDBACK_STATUSES = [
  "received",
  "under_review",
  "planned",
  "shipped",
  "not_now",
] as const;

export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  received: "Received",
  under_review: "Under review",
  planned: "Planned",
  shipped: "Shipped",
  not_now: "Not now",
};

export function getFeedbackCategoryLabel(category: FeedbackCategory): string {
  return FEEDBACK_CATEGORY_LABELS[category];
}

export function getFeedbackStatusLabel(status: FeedbackStatus): string {
  return FEEDBACK_STATUS_LABELS[status];
}
