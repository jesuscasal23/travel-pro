import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminEnv } from "@/lib/config/server-env";
import { UpstreamServiceError } from "@/lib/api/errors";
import type { FeedbackScreenshotInputSchema } from "./schemas";
import type { z } from "zod";

type FeedbackScreenshotInput = z.infer<typeof FeedbackScreenshotInputSchema>;

const DEFAULT_FEEDBACK_SCREENSHOT_BUCKET =
  process.env.SUPABASE_FEEDBACK_SCREENSHOT_BUCKET?.trim() || "feedback-screenshots";

function createSupabaseAdminStorageClient() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 180) || "feedback-screenshot";
}

export async function uploadFeedbackScreenshot(input: {
  feedbackId: string;
  userId: string;
  screenshot: FeedbackScreenshotInput;
}) {
  const storage = createSupabaseAdminStorageClient();
  const bucket = DEFAULT_FEEDBACK_SCREENSHOT_BUCKET;
  const objectPath = `${input.userId}/${input.feedbackId}/${Date.now()}-${sanitizeFilename(input.screenshot.filename)}`;
  const buffer = Buffer.from(input.screenshot.base64Data, "base64");

  const { error } = await storage.storage.from(bucket).upload(objectPath, buffer, {
    contentType: input.screenshot.contentType,
    upsert: false,
  });

  if (error) {
    throw new UpstreamServiceError("Failed to upload feedback screenshot", {
      service: "supabase-storage",
      bucket,
      message: error.message,
    });
  }

  return {
    bucket,
    path: objectPath,
    filename: input.screenshot.filename,
    contentType: input.screenshot.contentType,
    sizeBytes: input.screenshot.sizeBytes,
  };
}

export async function createFeedbackScreenshotSignedUrl(input: {
  bucket: string | null;
  path: string | null;
}) {
  if (!input.bucket || !input.path) {
    return null;
  }

  const storage = createSupabaseAdminStorageClient();
  const { data, error } = await storage.storage.from(input.bucket).createSignedUrl(input.path, 60 * 60);

  if (error) {
    return null;
  }

  return data.signedUrl;
}
