"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { Check, ExternalLink, ImageOff, MapPin, X } from "lucide-react";
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
const FEEDBACK_DEAD_ZONE = 20;

function ActivityImage({ card }: { card: ActivityDiscoveryCandidate }) {
  const [failed, setFailed] = useState(false);

  if (card.imageUrl && !failed) {
    return (
      <img
        src={card.imageUrl}
        alt={card.name}
        className="h-48 w-full object-cover"
        loading="eager"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="from-brand-primary-soft to-app-blue-100 flex h-36 items-center justify-center bg-gradient-to-br">
      {failed ? (
        <ImageOff className="text-brand-primary h-8 w-8 opacity-50" />
      ) : (
        <MapPin className="text-brand-primary h-8 w-8" />
      )}
    </div>
  );
}

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

  const dragX = useMotionValue(0);
  const cardRotate = useTransform(dragX, [-200, 0, 200], [-12, 0, 12]);
  const likeOpacity = useTransform(dragX, [FEEDBACK_DEAD_ZONE, SWIPE_THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(dragX, [-SWIPE_THRESHOLD, -FEEDBACK_DEAD_ZONE], [1, 0]);
  const nextCardScale = useTransform(dragX, [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD], [1, 0.96, 1]);
  const nextCardOpacity = useTransform(dragX, [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD], [1, 0.8, 1]);

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
          <motion.div
            style={{ scale: nextCardScale, opacity: nextCardOpacity }}
            className="shadow-glass-md absolute inset-x-2 top-2 rounded-[30px] border border-white/70 bg-white/85 p-5"
          >
            <div className="mb-4 overflow-hidden rounded-2xl border border-white/75">
              <ActivityImage card={nextCard} />
            </div>

            <div className="mb-2 flex items-start justify-between gap-3">
              <h3 className="text-ink text-lg font-semibold tracking-[-0.02em]">{nextCard.name}</h3>
              <span className="bg-brand-primary-soft text-brand-primary rounded-full px-2.5 py-1 text-xs font-semibold">
                {nextCard.category}
              </span>
            </div>

            <p className="text-dim text-sm">{nextCard.description}</p>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-label rounded-full border border-white/80 bg-white px-2.5 py-1 text-xs font-medium">
                {nextCard.duration}
              </span>
              <span className="text-brand-primary inline-flex items-center gap-1 text-xs font-semibold">
                Open in Google Maps
                <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </div>

            <div className="mt-5 flex gap-3">
              <div className="bg-surface-error-bg border-surface-error-border text-surface-error-text flex h-12 flex-1 items-center justify-center rounded-2xl border font-semibold">
                <X className="mr-1 h-4 w-4" />
                Skip
              </div>
              <div className="bg-brand-primary flex h-12 flex-1 items-center justify-center rounded-2xl font-semibold text-white">
                <Check className="mr-1 h-4 w-4" />
                Like
              </div>
            </div>
          </motion.div>
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={`${cursor}-${currentCard.name}`}
            style={{ x: dragX, rotate: cardRotate }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > SWIPE_THRESHOLD) onSwipe("liked");
              else if (info.offset.x < -SWIPE_THRESHOLD) onSwipe("disliked");
            }}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="shadow-glass-xl absolute inset-x-0 top-0 rounded-[30px] border border-white/80 bg-white p-5"
          >
            {/* LIKE stamp — upper-left, rotated */}
            <motion.div
              style={{ opacity: likeOpacity }}
              className="border-app-green pointer-events-none absolute top-6 left-6 z-10 rotate-[-18deg] rounded-lg border-[3px] px-3 py-1"
            >
              <span className="text-app-green text-xl font-extrabold tracking-wider uppercase">
                Like
              </span>
            </motion.div>

            {/* NOPE stamp — upper-right, rotated */}
            <motion.div
              style={{ opacity: nopeOpacity }}
              className="border-app-red pointer-events-none absolute top-6 right-6 z-10 rotate-[18deg] rounded-lg border-[3px] px-3 py-1"
            >
              <span className="text-app-red text-xl font-extrabold tracking-wider uppercase">
                Nope
              </span>
            </motion.div>

            <div className="mb-4 overflow-hidden rounded-2xl border border-white/75">
              <ActivityImage card={currentCard} />
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

            <div className="mt-5 flex gap-3">
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
          </motion.div>
        </AnimatePresence>
      </div>

      {error ? <p className="text-app-red px-1 text-xs">{error}</p> : null}
    </div>
  );
}
