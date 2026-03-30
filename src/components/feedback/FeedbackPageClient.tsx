"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, MessageSquareHeart, Sparkles } from "lucide-react";
import { AppScreen } from "@/components/ui/AppScreen";
import { useFeedback } from "@/hooks/api";
import { FeedbackComposerModal } from "./FeedbackComposerModal";

const statusClasses: Record<string, string> = {
  received: "bg-slate-100 text-slate-700",
  under_review: "bg-amber-100 text-amber-800",
  planned: "bg-sky-100 text-sky-800",
  shipped: "bg-emerald-100 text-emerald-800",
  not_now: "bg-rose-100 text-rose-700",
};

export function FeedbackPageClient() {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const feedbackQuery = useFeedback();
  const sortedFeedback = useMemo(
    () =>
      [...(feedbackQuery.data ?? [])].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      ),
    [feedbackQuery.data]
  );

  return (
    <AppScreen>
      <header className="shadow-glass-xs sticky top-0 z-40 bg-white/85 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/profile" className="flex items-center gap-2">
            <ChevronLeft className="text-ink h-5 w-5" />
            <span className="text-ink text-sm font-semibold">Profile</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsComposerOpen(true)}
            className="bg-brand-primary rounded-full px-4 py-2 text-xs font-bold tracking-[0.16em] text-white uppercase"
          >
            Share feedback
          </button>
        </div>
        <div className="bg-edge h-px w-full" />
      </header>

      <main className="space-y-6 px-6 pt-8 pb-8">
        <section className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eef5ff] px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-[#2f5f9f] uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            Founding user loop
          </div>
          <div>
            <h1 className="text-ink font-display text-[1.9rem] leading-tight font-extrabold">
              Your feedback
            </h1>
            <p className="text-label mt-2 max-w-[34ch] text-sm leading-relaxed">
              Every note here is part of the product conversation. You can track what you shared
              and what the team did with it.
            </p>
          </div>
        </section>

        {feedbackQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="border-edge/10 h-36 animate-pulse rounded-[28px] border bg-white"
              />
            ))}
          </div>
        ) : feedbackQuery.isError ? (
          <div className="rounded-[28px] bg-red-50 px-5 py-4 text-sm text-red-700">
            {feedbackQuery.error instanceof Error
              ? feedbackQuery.error.message
              : "Failed to load your feedback."}
          </div>
        ) : sortedFeedback.length === 0 ? (
          <section className="border-edge/10 rounded-[32px] border bg-white p-6 text-center shadow-[0_12px_24px_rgba(17,24,39,0.04)]">
            <div className="bg-brand-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[24px]">
              <MessageSquareHeart className="text-brand-primary h-8 w-8" />
            </div>
            <h2 className="text-ink font-display text-xl font-bold">Nothing submitted yet</h2>
            <p className="text-label mx-auto mt-2 max-w-[28ch] text-sm leading-relaxed">
              Your ideas, bug reports, and wins help decide what Travel Pro builds next.
            </p>
            <button
              type="button"
              onClick={() => setIsComposerOpen(true)}
              className="bg-brand-primary mt-5 rounded-2xl px-5 py-3 text-sm font-semibold text-white"
            >
              Send your first piece of feedback
            </button>
          </section>
        ) : (
          <div className="space-y-4">
            {sortedFeedback.map((item) => (
              <article
                key={item.id}
                className="border-edge/10 overflow-hidden rounded-[30px] border bg-white shadow-[0_12px_24px_rgba(17,24,39,0.04)]"
              >
                <div className="flex items-start justify-between gap-4 px-5 pt-5">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#eef5ff] px-3 py-1 text-[11px] font-bold tracking-[0.12em] text-[#2f5f9f] uppercase">
                        {item.categoryLabel}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.12em] uppercase ${statusClasses[item.status] ?? "bg-slate-100 text-slate-700"}`}
                      >
                        {item.statusLabel}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-ink text-base font-semibold">{item.title}</h2>
                      <p className="text-label mt-1 text-xs">
                        Submitted {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>

                  {item.screenshot?.url ? (
                    <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.screenshot.url}
                        alt={`Screenshot for ${item.title}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="px-5 py-4">
                  <p className="text-ink text-sm leading-relaxed">{item.description}</p>
                </div>

                <div className="border-edge/10 bg-slate-50/70 px-5 py-4">
                  <p className="text-ink text-xs font-semibold tracking-[0.14em] uppercase">
                    Latest team update
                  </p>
                  <p className="text-label mt-2 text-sm leading-relaxed">
                    {item.latestStaffNote
                      ? item.latestStaffNote
                      : item.latestUpdate
                        ? `Status updated to ${item.latestUpdate.statusLabel.toLowerCase()}.`
                        : "We've received this and will update you here as the team reviews it."}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <FeedbackComposerModal open={isComposerOpen} onOpenChange={setIsComposerOpen} />
    </AppScreen>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
