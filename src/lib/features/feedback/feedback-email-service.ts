import { getOptionalFeedbackEmailEnv } from "@/lib/config/server-env";
import { getFeedbackStatusLabel, type FeedbackStatus } from "./constants";

export interface FeedbackStatusEmailPayload {
  toEmail: string | null;
  feedbackTitle: string;
  feedbackStatus: FeedbackStatus;
  staffNote?: string;
}

export interface FeedbackEmailResult {
  deliveryStatus: "sent" | "skipped" | "failed";
  error?: string;
}

export async function sendFeedbackStatusEmail(
  payload: FeedbackStatusEmailPayload
): Promise<FeedbackEmailResult> {
  if (!payload.toEmail) {
    return { deliveryStatus: "skipped" };
  }

  const env = getOptionalFeedbackEmailEnv();
  if (!env) {
    return { deliveryStatus: "skipped" };
  }

  const statusLabel = getFeedbackStatusLabel(payload.feedbackStatus);
  const noteBlock = payload.staffNote
    ? `<p style="margin:16px 0 0;color:#1f2937;"><strong>Note from the team:</strong><br/>${escapeHtml(payload.staffNote).replace(/\n/g, "<br/>")}</p>`
    : "";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.fromEmail,
      to: [payload.toEmail],
      ...(env.replyToEmail ? { reply_to: env.replyToEmail } : {}),
      subject: `Update on your Travel Pro feedback: ${statusLabel}`,
      html: `<div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#0f172a;">
        <p style="margin:0 0 12px;">You're one of the early users shaping Travel Pro, and we wanted to close the loop on your feedback.</p>
        <p style="margin:0 0 12px;"><strong>${escapeHtml(payload.feedbackTitle)}</strong></p>
        <p style="margin:0;"><strong>Current status:</strong> ${escapeHtml(statusLabel)}</p>
        ${noteBlock}
        <p style="margin:20px 0 0;color:#475569;">Thanks for helping shape what we build next.</p>
      </div>`,
    }),
  });

  if (!res.ok) {
    const error = await safeReadBody(res);
    return { deliveryStatus: "failed", error };
  }

  return { deliveryStatus: "sent" };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function safeReadBody(res: Response) {
  try {
    return await res.text();
  } catch {
    return "Unknown email delivery error";
  }
}
