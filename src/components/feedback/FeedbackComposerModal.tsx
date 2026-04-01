"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useCreateFeedback } from "@/hooks/api";
import type { FeedbackItem } from "@/hooks/api/feedback/shared";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_LABELS,
  type FeedbackCategory,
} from "@/lib/features/feedback/constants";

const ACCEPTED_SCREENSHOT_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
const MAX_SCREENSHOT_SIZE_BYTES = 5 * 1024 * 1024;

interface FeedbackComposerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackComposerModal({ open, onOpenChange }: FeedbackComposerModalProps) {
  const pathname = usePathname();
  const createFeedbackMutation = useCreateFeedback();
  const wasOpenRef = useRef(open);
  const [category, setCategory] = useState<FeedbackCategory>("feature_request");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<FeedbackItem | null>(null);

  const tripId = useMemo(() => {
    const match = pathname?.match(/^\/trips\/([^/]+)/);
    return match?.[1] ?? null;
  }, [pathname]);

  useEffect(() => {
    if (wasOpenRef.current && !open) {
      setCategory("feature_request");
      setTitle("");
      setDescription("");
      setScreenshotFile(null);
      setErrorMessage(null);
      setSuccessFeedback(null);
      createFeedbackMutation.reset();
    }
    wasOpenRef.current = open;
  }, [open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (title.trim().length < 4) {
      setErrorMessage("Give your feedback a short title so we can scan it quickly.");
      return;
    }

    if (description.trim().length < 12) {
      setErrorMessage("Add a bit more detail so the team can act on it.");
      return;
    }

    try {
      const screenshot = screenshotFile
        ? {
            filename: screenshotFile.name,
            contentType: screenshotFile.type as (typeof ACCEPTED_SCREENSHOT_TYPES)[number],
            sizeBytes: screenshotFile.size,
            base64Data: await fileToBase64(screenshotFile),
          }
        : undefined;

      const feedback = await createFeedbackMutation.mutateAsync({
        category,
        title: title.trim(),
        description: description.trim(),
        sourceRoute: pathname || "/home",
        tripId,
        browserInfo: typeof window !== "undefined" ? buildBrowserInfo() : undefined,
        screenshot,
      });

      setSuccessFeedback(feedback);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to send feedback.");
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={successFeedback ? "Thank you for shaping Travel Pro" : "Share feedback"}
      maxWidth="max-w-lg"
      mobileSheet
      contentClassName="max-h-[85vh] overflow-y-auto"
    >
      {successFeedback ? (
        <div className="space-y-4">
          <div className="bg-brand-primary/10 flex h-14 w-14 items-center justify-center rounded-2xl">
            <CheckCircle2 className="text-brand-primary h-7 w-7" />
          </div>
          <div className="space-y-2">
            <p className="text-ink text-base font-semibold">
              You're one of the founding users helping decide what Travel Pro builds next.
            </p>
            <p className="text-label text-sm leading-relaxed">
              We logged <strong>{successFeedback.title}</strong> and the team now has your route,
              app version, and any extra context you shared.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/feedback"
              onClick={() => onOpenChange(false)}
              className="bg-brand-primary rounded-2xl px-4 py-3 text-center text-sm font-semibold text-white"
            >
              View your feedback
            </Link>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="border-edge text-ink rounded-2xl border px-4 py-3 text-sm font-semibold"
            >
              Back to the app
            </button>
          </div>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="rounded-[28px] border border-[#dce7f6] bg-[#f6f9ff] p-4">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="text-brand-primary h-4 w-4" />
              <p className="text-brand-primary text-xs font-bold tracking-[0.18em] uppercase">
                Founding user channel
              </p>
            </div>
            <p className="text-ink text-sm leading-relaxed">
              This is not a dead-end support form. Early users are shaping the roadmap, and what
              you send here directly influences what we build next.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-ink text-sm font-semibold">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {FEEDBACK_CATEGORIES.map((option) => {
                const isActive = category === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setCategory(option)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                      isActive
                        ? "border-brand-primary bg-brand-primary text-white"
                        : "border-edge text-ink bg-white"
                    }`}
                  >
                    {FEEDBACK_CATEGORY_LABELS[option]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="feedback-title" className="text-ink text-sm font-semibold">
              Title
            </label>
            <input
              id="feedback-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What should we know?"
              className="border-edge text-ink placeholder:text-label w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none focus:border-[#9db7df]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="feedback-description" className="text-ink text-sm font-semibold">
              Description
            </label>
            <textarea
              id="feedback-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Tell us what happened, what felt missing, or what you loved."
              rows={6}
              className="border-edge text-ink placeholder:text-label min-h-[144px] w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none focus:border-[#9db7df]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-ink text-sm font-semibold">Screenshot (optional)</label>
            <label className="border-edge hover:bg-surface-soft flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed px-4 py-4 transition-colors">
              <div className="bg-brand-primary/10 flex h-10 w-10 items-center justify-center rounded-2xl">
                <ImagePlus className="text-brand-primary h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-ink truncate text-sm font-medium">
                  {screenshotFile ? screenshotFile.name : "Attach a screenshot"}
                </p>
                <p className="text-label text-xs">
                  PNG, JPG, or WebP up to {Math.round(MAX_SCREENSHOT_SIZE_BYTES / 1024 / 1024)} MB
                </p>
              </div>
              <input
                type="file"
                accept={ACCEPTED_SCREENSHOT_TYPES.join(",")}
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (!file) {
                    setScreenshotFile(null);
                    return;
                  }

                  if (
                    !ACCEPTED_SCREENSHOT_TYPES.includes(
                      file.type as (typeof ACCEPTED_SCREENSHOT_TYPES)[number]
                    )
                  ) {
                    setErrorMessage("Use a PNG, JPG, or WebP screenshot.");
                    return;
                  }

                  if (file.size > MAX_SCREENSHOT_SIZE_BYTES) {
                    setErrorMessage("Screenshots must be 5 MB or smaller.");
                    return;
                  }

                  setErrorMessage(null);
                  setScreenshotFile(file);
                }}
              />
            </label>
          </div>

          {errorMessage && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={createFeedbackMutation.isPending}
            className="bg-brand-primary flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {createFeedbackMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending feedback...
              </>
            ) : (
              "Send feedback"
            )}
          </button>
        </form>
      )}
    </Modal>
  );
}

function buildBrowserInfo() {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    platform: navigator.platform,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  };
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const base64Data = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64Data);
    };

    reader.onerror = () => {
      reject(new Error("Failed to read screenshot."));
    };

    reader.readAsDataURL(file);
  });
}
