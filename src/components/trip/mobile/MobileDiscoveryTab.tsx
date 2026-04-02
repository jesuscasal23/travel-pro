"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { Check, ExternalLink, ImageOff, MapPin, Sparkles, X } from "lucide-react";
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
  cityIndex: number;
  totalCities: number;
  likedCount: number;
  requiredCount: number;
  currentCityName?: string;
  roundLimitReached?: boolean;
}

const SWIPE_THRESHOLD = 110;
const FEEDBACK_DEAD_ZONE = 20;

function getActivityImageKey(card: ActivityDiscoveryCandidate): string {
  const urls = card.imageUrls?.join("|") ?? card.imageUrl ?? "";
  return `${card.name}|${card.googleMapsUrl}|${urls}`;
}

function ActivityImages({ card }: { card: ActivityDiscoveryCandidate }) {
  const [primaryFailed, setPrimaryFailed] = useState(false);
  const [secondaryFailed, setSecondaryFailed] = useState(false);

  const imageSources = useMemo(() => {
    if (card.imageUrls && card.imageUrls.length > 0) {
      return card.imageUrls.filter((url): url is string => Boolean(url));
    }
    return card.imageUrl ? [card.imageUrl] : [];
  }, [card.imageUrls, card.imageUrl]);

  const renderFallback = () => (
    <div className="from-brand-primary-soft to-app-blue-100 flex h-48 w-full items-center justify-center bg-gradient-to-br">
      {primaryFailed ? (
        <ImageOff className="text-brand-primary h-8 w-8 opacity-50" />
      ) : (
        <MapPin className="text-brand-primary h-8 w-8" />
      )}
    </div>
  );

  if (imageSources.length === 0 || primaryFailed) {
    return renderFallback();
  }

  const primaryUrl = imageSources[0]!;
  const hasSecondary = imageSources.length > 1 && !secondaryFailed;

  if (!hasSecondary) {
    return (
      <img
        src={primaryUrl}
        alt={card.name}
        className="h-48 w-full object-cover"
        loading="eager"
        onError={() => setPrimaryFailed(true)}
      />
    );
  }

  const secondaryUrl = imageSources[1]!;

  return (
    <div className="grid h-48 w-full grid-cols-[1.6fr_1fr] gap-[2px] bg-white/30">
      <img
        src={primaryUrl}
        alt={card.name}
        className="h-full w-full object-cover"
        loading="eager"
        onError={() => setPrimaryFailed(true)}
      />
      <img
        src={secondaryUrl}
        alt={`${card.name} alternate view`}
        className="h-full w-full object-cover"
        loading="eager"
        onError={() => setSecondaryFailed(true)}
      />
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
  cityIndex,
  totalCities,
  likedCount,
  requiredCount,
  currentCityName,
  roundLimitReached,
}: MobileDiscoveryTabProps) {
  const currentCard = cards[cursor];
  const nextCard = cards[cursor + 1];
  const swipedCount = Math.min(cursor, totalTarget);
  const isCompleted = status === "completed" || (totalTarget > 0 && swipedCount >= totalTarget);

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
          ) : roundLimitReached ? (
            <>
              <p className="text-brand-primary text-[11px] font-bold tracking-[0.2em] uppercase">
                All Suggestions Explored
              </p>
              <h2 className="text-navy mt-2 text-[1.55rem] font-bold tracking-[-0.03em]">
                That&apos;s everything!
              </h2>
              <p className="text-dim mx-auto mt-2 max-w-[28ch] text-sm">
                You&apos;ve seen all activity suggestions for this city. Like more from your
                existing cards or continue to the next city.
              </p>
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
          {currentCityName ?? "Activity Discovery"}
          {isMultiCity && totalCities > 1 ? (
            <span className="text-dim ml-1.5 text-[10px] font-medium tracking-normal normal-case">
              ({cityIndex + 1}/{totalCities})
            </span>
          ) : null}
        </p>
        {requiredCount > 0 ? (
          <p className="text-dim text-xs">
            {likedCount} / {requiredCount} liked
          </p>
        ) : (
          <p className="text-dim text-xs">{progressLabel}</p>
        )}
      </div>

      <div className="relative min-h-[560px]">
        {nextCard ? (
          <motion.div
            style={{ scale: nextCardScale, opacity: nextCardOpacity }}
            className="shadow-glass-md absolute inset-x-2 top-2 rounded-[30px] border border-white/70 bg-white/85 p-5"
          >
            <div className="mb-4 overflow-hidden rounded-2xl border border-white/75">
              <ActivityImages key={getActivityImageKey(nextCard)} card={nextCard} />
            </div>

            <div className="mb-1 flex items-start justify-between gap-3">
              <h3 className="text-ink text-lg font-semibold tracking-[-0.02em]">{nextCard.name}</h3>
              <span className="bg-brand-primary-soft text-brand-primary shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold">
                {nextCard.category}
              </span>
            </div>

            {nextCard.venueType ? (
              <p className="text-steel mb-2 text-xs font-medium">{nextCard.venueType}</p>
            ) : null}

            <p className="text-dim text-sm">{nextCard.description}</p>

            {nextCard.highlights.length > 0 ? (
              <ul className="mt-2.5 space-y-1">
                {nextCard.highlights.map((h) => (
                  <li key={h} className="text-ink flex items-start gap-1.5 text-xs">
                    <Sparkles className="text-brand-primary mt-0.5 h-3 w-3 shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-3 flex items-center justify-between">
              <span className="text-label rounded-full border border-white/80 bg-white px-2.5 py-1 text-xs font-medium">
                {nextCard.duration}
              </span>
              <span className="text-brand-primary inline-flex items-center gap-1 text-xs font-semibold">
                Open in Google Maps
                <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </div>

            <div className="mt-4 flex gap-3">
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
              <ActivityImages key={getActivityImageKey(currentCard)} card={currentCard} />
            </div>

            <div className="mb-1 flex items-start justify-between gap-3">
              <h3 className="text-ink text-lg font-semibold tracking-[-0.02em]">
                {currentCard.name}
              </h3>
              <span className="bg-brand-primary-soft text-brand-primary shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold">
                {currentCard.category}
              </span>
            </div>

            {currentCard.venueType ? (
              <p className="text-steel mb-2 text-xs font-medium">{currentCard.venueType}</p>
            ) : null}

            <p className="text-dim text-sm">{currentCard.description}</p>

            {currentCard.highlights.length > 0 ? (
              <ul className="mt-2.5 space-y-1">
                {currentCard.highlights.map((h) => (
                  <li key={h} className="text-ink flex items-start gap-1.5 text-xs">
                    <Sparkles className="text-brand-primary mt-0.5 h-3 w-3 shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-3 flex items-center justify-between">
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
