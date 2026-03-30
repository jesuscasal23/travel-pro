import { z } from "zod";
import { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES } from "./constants";

export const FeedbackCategorySchema = z.enum(FEEDBACK_CATEGORIES);
export const FeedbackStatusSchema = z.enum(FEEDBACK_STATUSES);

export const FeedbackBrowserInfoSchema = z
  .object({
    userAgent: z.string().trim().max(1000).optional(),
    language: z.string().trim().max(64).optional(),
    timezone: z.string().trim().max(120).optional(),
    platform: z.string().trim().max(120).optional(),
    viewport: z
      .object({
        width: z.number().int().positive().max(10_000),
        height: z.number().int().positive().max(10_000),
      })
      .optional(),
  })
  .optional();

export const FeedbackScreenshotInputSchema = z.object({
  filename: z.string().trim().min(1).max(180),
  contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  sizeBytes: z.number().int().positive().max(5 * 1024 * 1024),
  base64Data: z.string().min(1).max(8_000_000),
});

export const FeedbackCreateInputSchema = z.object({
  category: FeedbackCategorySchema,
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().min(12).max(4_000),
  sourceRoute: z.string().trim().min(1).max(300),
  tripId: z.string().uuid().nullable().optional(),
  browserInfo: FeedbackBrowserInfoSchema,
  screenshot: FeedbackScreenshotInputSchema.optional(),
});

export const FeedbackStatusUpdateInputSchema = z.object({
  status: FeedbackStatusSchema,
  staffNote: z
    .string()
    .trim()
    .max(2_000)
    .optional()
    .transform((value) => (value ? value : undefined)),
});
