"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ExternalLink, MapPin, X } from "lucide-react";
import type { ActivityDiscoveryCandidate, DiscoveryStatus } from "@/types";

interface MobileDiscoveryTabProps {
  status: DiscoveryStatus;
  cards: ActivityDiscoveryCandidate[];
  cursor: number;
  totalTarget: number;
  isLoading: boolean;
  error: string | null;
  isMultiCity: boolean;
  onSwipe: (decision: "liked" | "disliked") => void;
}

const SWIPE_THRESHOLD = 110;

export function MobileDiscoveryTab({
  status,
  cards,
  cursor,
  totalTarget,
  isLoading,
  error,
  isMultiCity,
  onSwipe,
}: MobileDiscoveryTabProps) {
  const [showMultiCityBanner, setShowMultiCityBanner] = useState(true);
  const currentCard = cards[cursor];
  const nextCard = cards[cursor + 1];
  const swipedCount = Math.min(cursor, totalTarget);
  const isCompleted = status === "completed" || swipedCount >= totalTarget;

  const progressLabel = useMemo(() => {
    return `${Math.min(swipedCount, totalTarget)} / ${totalTarget}`;
  }, [swipedCount, totalTarget]);

  if (isCompleted) {
    return (
      <div className="space-y-3 py-2">
        {isMultiCity && showMultiCityBanner ? (
          <div className="border-brand-primary-border bg-brand-primary-subtle relative rounded-2xl border px-4 py-3">
            <p className="text-steel pr-8 text-sm">
              Multi-city itinerary assembly is still in development.
            </p>
            <button
              type="button"
              onClick={() => setShowMultiCityBanner(false)}
              className="text-muted-foreground hover:text-foreground absolute top-2 right-2"
              aria-label="Dismiss multi-city notice"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <div className="shadow-glass-lg rounded-[28px] border border-white/80 bg-white/90 px-5 py-8 text-center">
          <p className="text-brand-primary text-[11px] font-bold tracking-[0.2em] uppercase">
            Discovery Complete
          </p>
          <h2 className="text-navy mt-2 text-[1.55rem] font-bold tracking-[-0.03em]">Thank you</h2>
          <p className="text-dim mx-auto mt-2 max-w-[26ch] text-sm">
            We are creating your itinerary based on your activity preferences.
          </p>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="space-y-3 py-2">
        <div className="shadow-glass-lg rounded-[28px] border border-white/80 bg-white/90 px-5 py-8 text-center">
          {isLoading ? (
            <>
              <div className="border-brand-primary mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
              <p className="text-ink text-sm font-medium">Generating activity cards...</p>
            </>
          ) : (
            <>
              <p className="text-ink text-sm font-medium">No activity cards available yet.</p>
              {error ? <p className="text-app-red mt-2 text-xs">{error}</p> : null}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-brand-primary text-[11px] font-bold tracking-[0.18em] uppercase">
          Activity Discovery
        </p>
        <p className="text-dim text-xs">{progressLabel}</p>
      </div>

      <div className="relative min-h-[480px]">
        {nextCard ? (
          <div className="shadow-glass-md absolute inset-x-4 top-4 rounded-[28px] border border-white/70 bg-white/75 p-5 opacity-80">
            <p className="text-ink line-clamp-1 text-sm font-semibold">{nextCard.name}</p>
            <p className="text-dim mt-1 line-clamp-2 text-xs">{nextCard.description}</p>
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={`${cursor}-${currentCard.name}`}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > SWIPE_THRESHOLD) onSwipe("liked");
              if (info.offset.x < -SWIPE_THRESHOLD) onSwipe("disliked");
            }}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="shadow-glass-xl absolute inset-x-0 top-0 rounded-[30px] border border-white/80 bg-white/92 p-5"
          >
            <div className="mb-4 overflow-hidden rounded-2xl border border-white/75">
              <div className="from-brand-primary-soft to-app-blue-100 flex h-36 items-center justify-center bg-gradient-to-br">
                <MapPin className="text-brand-primary h-8 w-8" />
              </div>
            </div>

            <div className="mb-2 flex items-start justify-between gap-3">
              <h3 className="text-ink text-lg font-semibold tracking-[-0.02em]">
                {currentCard.name}
              </h3>
              <span className="bg-brand-primary-soft text-brand-primary rounded-full px-2.5 py-1 text-xs font-semibold">
                {currentCard.category}
              </span>
            </div>

            <p className="text-dim text-sm">{currentCard.description}</p>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-label rounded-full border border-white/80 bg-white px-2.5 py-1 text-xs font-medium">
                {currentCard.duration}
              </span>
              <a
                href={currentCard.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-brand-primary inline-flex items-center gap-1 text-xs font-semibold"
              >
                Open in Google Maps
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onSwipe("disliked")}
          className="bg-surface-error-bg border-surface-error-border text-surface-error-text flex h-12 flex-1 items-center justify-center rounded-2xl border font-semibold"
          aria-label="Dislike activity"
        >
          <X className="mr-1 h-4 w-4" />
          Skip
        </button>
        <button
          type="button"
          onClick={() => onSwipe("liked")}
          className="bg-brand-primary flex h-12 flex-1 items-center justify-center rounded-2xl font-semibold text-white"
          aria-label="Like activity"
        >
          <Check className="mr-1 h-4 w-4" />
          Like
        </button>
      </div>

      {error ? <p className="text-app-red px-1 text-xs">{error}</p> : null}
    </div>
  );
}
