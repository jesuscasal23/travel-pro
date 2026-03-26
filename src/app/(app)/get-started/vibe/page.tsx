"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Mountain,
  Sofa,
  Users,
  BookOpen,
  Gem,
  Wallet,
  CalendarCheck,
  Shuffle,
  Sun,
  CloudSnow,
} from "lucide-react";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { BackButton } from "@/components/ui/BackButton";
import { useTripStore } from "@/stores/useTripStore";
import type { LucideIcon } from "lucide-react";
import type { VibeKey, VibeScores } from "@/types";

type VibeSlider = {
  id: VibeKey;
  leftLabel: string;
  rightLabel: string;
  leftIcon: LucideIcon;
  rightIcon: LucideIcon;
};

const vibeSliders: VibeSlider[] = [
  {
    id: "adventureComfort",
    leftLabel: "Adventure",
    rightLabel: "Comfort",
    leftIcon: Mountain,
    rightIcon: Sofa,
  },
  {
    id: "socialQuiet",
    leftLabel: "Social",
    rightLabel: "Quiet",
    leftIcon: Users,
    rightIcon: BookOpen,
  },
  {
    id: "luxuryBudget",
    leftLabel: "Luxury",
    rightLabel: "Budget",
    leftIcon: Gem,
    rightIcon: Wallet,
  },
  {
    id: "structuredSpontaneous",
    leftLabel: "Structured",
    rightLabel: "Spontaneous",
    leftIcon: CalendarCheck,
    rightIcon: Shuffle,
  },
  {
    id: "warmMixed",
    leftLabel: "Warm Weather",
    rightLabel: "Mixed Climates",
    leftIcon: Sun,
    rightIcon: CloudSnow,
  },
];

const DEFAULT_VIBES: VibeScores = {
  adventureComfort: 50,
  socialQuiet: 50,
  luxuryBudget: 50,
  structuredSpontaneous: 50,
  warmMixed: 50,
};

export default function VibePage() {
  const router = useRouter();
  const storedVibes = useTripStore((s) => s.vibes);
  const setVibesStore = useTripStore((s) => s.setVibes);
  const vibes = storedVibes ?? DEFAULT_VIBES;

  const setVibes = (updater: (prev: VibeScores) => VibeScores) => {
    setVibesStore(updater(vibes));
  };

  return (
    <GradientBackground>
      <div className="relative flex h-dvh flex-col">
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <div className="pt-4">
            <BackButton href="/get-started/personalization" />
          </div>

          <header className="pt-3">
            <p className="text-brand-primary font-display text-[11px] font-bold tracking-[0.34em] uppercase">
              The Vibe
            </p>
            <h1 className="font-display text-ink mt-2 text-[2.35rem] leading-[1.02] font-bold tracking-[-0.05em]">
              Tell us about you
            </h1>
            <p className="text-dim mt-2 text-[15px] leading-7">
              Slide to share your travel philosophy.
            </p>
          </header>

          <section className="space-y-4 pt-6">
            {vibeSliders.map((slider) => {
              const currentValue = vibes[slider.id];
              const LeftIcon = slider.leftIcon;
              const RightIcon = slider.rightIcon;
              const leftOpacity = 1 - currentValue / 100;
              const rightOpacity = currentValue / 100;

              return (
                <div
                  key={slider.id}
                  className="shadow-glass-xs rounded-2xl bg-white/60 px-4 py-3 backdrop-blur-sm"
                >
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <span
                      className="flex items-center gap-2 transition-opacity duration-200"
                      style={{ opacity: 0.45 + 0.55 * leftOpacity }}
                    >
                      <span className="bg-primary/10 flex h-7 w-7 items-center justify-center rounded-lg">
                        <LeftIcon className="text-brand-primary h-3.5 w-3.5" strokeWidth={2.4} />
                      </span>
                      <span
                        className="text-[11px] font-bold tracking-[0.16em] uppercase"
                        style={{
                          color: leftOpacity > 0.5 ? "var(--brand-primary)" : "var(--color-label)",
                        }}
                      >
                        {slider.leftLabel}
                      </span>
                    </span>
                    <span
                      className="flex items-center gap-2 transition-opacity duration-200"
                      style={{ opacity: 0.45 + 0.55 * rightOpacity }}
                    >
                      <span
                        className="text-[11px] font-bold tracking-[0.16em] uppercase"
                        style={{
                          color: rightOpacity > 0.5 ? "var(--brand-primary)" : "var(--color-label)",
                        }}
                      >
                        {slider.rightLabel}
                      </span>
                      <span className="bg-primary/10 flex h-7 w-7 items-center justify-center rounded-lg">
                        <RightIcon className="text-brand-primary h-3.5 w-3.5" strokeWidth={2.4} />
                      </span>
                    </span>
                  </div>

                  <div className="relative">
                    <div className="bg-slider-track pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full" />
                    <div
                      className="bg-brand-primary pointer-events-none absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-full transition-[width] duration-75"
                      style={{ width: `${currentValue}%` }}
                    />

                    <input
                      aria-label={`${slider.leftLabel} to ${slider.rightLabel}`}
                      type="range"
                      min="0"
                      max="100"
                      value={currentValue}
                      onChange={(event) => {
                        const nextValue = Math.max(0, Math.min(100, Number(event.target.value)));
                        setVibes((prev) => ({ ...prev, [slider.id]: nextValue }));
                      }}
                      className="vibe-slider relative h-8 w-full cursor-pointer appearance-none bg-transparent"
                    />
                  </div>
                </div>
              );
            })}
          </section>
        </div>

        <div className="shrink-0 px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => router.push("/get-started/interests")}
            className="bg-ink shadow-dark-cta flex w-full items-center justify-center gap-3 rounded-[24px] px-6 py-5 text-lg font-bold text-white transition-transform duration-200 active:scale-[0.985]"
          >
            <span>Continue</span>
            <ArrowRight className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>
      </div>

      <style jsx>{`
        .vibe-slider::-webkit-slider-thumb {
          appearance: none;
          width: 26px;
          height: 26px;
          border-radius: 9999px;
          background: #ffffff;
          border: 3px solid #ffffff;
          box-shadow:
            0 2px 8px rgba(27, 43, 75, 0.18),
            0 8px 20px rgba(27, 43, 75, 0.1),
            inset 0 0 0 4px var(--brand-primary);
          margin-top: -11px;
          position: relative;
          z-index: 2;
          transition: box-shadow 0.15s ease;
        }

        .vibe-slider:active::-webkit-slider-thumb {
          box-shadow:
            0 2px 8px rgba(27, 43, 75, 0.22),
            0 8px 20px rgba(27, 43, 75, 0.14),
            inset 0 0 0 6px var(--brand-primary);
        }

        .vibe-slider::-moz-range-thumb {
          width: 26px;
          height: 26px;
          border-radius: 9999px;
          background: #ffffff;
          border: 3px solid #ffffff;
          box-shadow:
            0 2px 8px rgba(27, 43, 75, 0.18),
            0 8px 20px rgba(27, 43, 75, 0.1),
            inset 0 0 0 4px var(--brand-primary);
        }

        .vibe-slider::-webkit-slider-runnable-track {
          height: 6px;
          background: transparent;
        }

        .vibe-slider::-moz-range-track {
          height: 6px;
          background: transparent;
        }
      `}</style>
    </GradientBackground>
  );
}
