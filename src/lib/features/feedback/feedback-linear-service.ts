import { getOptionalLinearEnv } from "@/lib/config/server-env";
import { getFeedbackCategoryLabel, type FeedbackCategory } from "./constants";

export interface LinearFeedbackIssueInput {
  feedbackId: string;
  category: FeedbackCategory;
  title: string;
  description: string;
  userId: string;
  userEmail: string | null;
  userDisplayName: string | null;
  sourceRoute: string;
  appVersion: string;
  tripId: string | null;
  browserInfo: unknown;
  hasScreenshot: boolean;
}

export interface LinearFeedbackIssueResult {
  id: string;
  identifier: string;
  url: string;
}

export async function createLinearFeedbackIssue(
  input: LinearFeedbackIssueInput
): Promise<LinearFeedbackIssueResult | null> {
  const env = getOptionalLinearEnv();
  if (!env) {
    return null;
  }

  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: env.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        mutation IssueCreate($input: IssueCreateInput!) {
          issueCreate(input: $input) {
            success
            issue {
              id
              identifier
              url
            }
          }
        }
      `,
      variables: {
        input: {
          teamId: env.teamId,
          ...(env.projectId ? { projectId: env.projectId } : {}),
          ...(env.labelIds.length > 0 ? { labelIds: env.labelIds } : {}),
          title: `[Feedback] ${getFeedbackCategoryLabel(input.category)}: ${input.title}`.slice(0, 255),
          description: buildLinearDescription(input),
        },
      },
    }),
  });

  const payload = (await response.json()) as {
    data?: {
      issueCreate?: {
        success?: boolean;
        issue?: LinearFeedbackIssueResult | null;
      };
    };
    errors?: Array<{ message?: string }>;
  };

  if (!response.ok || payload.errors?.length || !payload.data?.issueCreate?.success) {
    const errorMessage =
      payload.errors?.map((error) => error.message).filter(Boolean).join("; ") ||
      "Linear issue creation failed";
    throw new Error(errorMessage);
  }

  return payload.data.issueCreate.issue ?? null;
}

function buildLinearDescription(input: LinearFeedbackIssueInput) {
  const browserInfo = input.browserInfo
    ? `\n\n## Browser / device\n\`\`\`json\n${JSON.stringify(input.browserInfo, null, 2)}\n\`\`\``
    : "";

  return [
    "## User feedback",
    `- Feedback ID: \`${input.feedbackId}\``,
    `- Category: ${getFeedbackCategoryLabel(input.category)}`,
    `- User: ${input.userDisplayName ?? "Unknown"}${input.userEmail ? ` (${input.userEmail})` : ""}`,
    `- User ID: \`${input.userId}\``,
    `- Route: \`${input.sourceRoute}\``,
    `- App version: \`${input.appVersion}\``,
    `- Trip ID: ${input.tripId ? `\`${input.tripId}\`` : "n/a"}`,
    `- Screenshot attached in app: ${input.hasScreenshot ? "yes" : "no"}`,
    "",
    "## Title",
    input.title,
    "",
    "## Description",
    input.description,
    browserInfo,
  ].join("\n");
}
