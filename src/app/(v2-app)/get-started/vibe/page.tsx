"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTripStore } from "@/stores/useTripStore";

type VibeSlider = {
  id:
    | "vibeAdventureComfort"
    | "vibeSocialQuiet"
    | "vibeLuxuryBudget"
    | "vibeStructuredSpontaneous"
    | "vibeWarmMixed";
  leftLabel: string;
  rightLabel: string;
};

const vibeSliders: VibeSlider[] = [
  { id: "vibeAdventureComfort", leftLabel: "Adventure", rightLabel: "Comfort" },
  { id: "vibeSocialQuiet", leftLabel: "Social", rightLabel: "Quiet" },
  { id: "vibeLuxuryBudget", leftLabel: "Luxury", rightLabel: "Budget" },
  { id: "vibeStructuredSpontaneous", leftLabel: "Structured", rightLabel: "Spontaneous" },
  { id: "vibeWarmMixed", leftLabel: "Warm Weather", rightLabel: "Mixed Climates" },
];

export default function V2VibePage() {
  const router = useRouter();
  const vibeAdventureComfort = useTripStore((s) => s.vibeAdventureComfort);
  const vibeSocialQuiet = useTripStore((s) => s.vibeSocialQuiet);
  const vibeLuxuryBudget = useTripStore((s) => s.vibeLuxuryBudget);
  const vibeStructuredSpontaneous = useTripStore((s) => s.vibeStructuredSpontaneous);
  const vibeWarmMixed = useTripStore((s) => s.vibeWarmMixed);
  const setVibeValue = useTripStore((s) => s.setVibeValue);

  const values = {
    vibeAdventureComfort,
    vibeSocialQuiet,
    vibeLuxuryBudget,
    vibeStructuredSpontaneous,
    vibeWarmMixed,
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f6f8fb_55%,#eef2f7_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-[-8rem] h-72 bg-[radial-gradient(circle_at_top,#2563ff14_0%,transparent_62%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(circle_at_bottom,#1b2b4b10_0%,transparent_60%)]" />

      <div className="relative flex min-h-dvh flex-col">
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="pt-6">
            <button
              type="button"
              onClick={() => router.push("/get-started/personalization")}
              aria-label="Go back"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 text-[#8aa0c0] shadow-[0_12px_30px_rgba(27,43,75,0.08)] backdrop-blur-sm transition-colors hover:text-[#1b2b4b]"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
            </button>
          </div>

          <header className="pt-4">
            <p className="font-display text-[11px] font-bold tracking-[0.34em] text-[#2563ff] uppercase">
              The Vibe
            </p>
            <h1 className="font-display mt-3 text-[2.35rem] leading-[1.02] font-bold tracking-[-0.05em] text-[#101114]">
              Tell us about you
            </h1>
            <p className="mt-3 text-[15px] leading-7 text-[#6d7b91]">
              Slide to share your travel philosophy.
            </p>
          </header>

          <section className="space-y-8 pt-8">
            {vibeSliders.map((slider) => {
              const currentValue = values[slider.id];

              return (
                <div key={slider.id}>
                  <div className="mb-3 flex items-center justify-between gap-4 text-[11px] font-bold tracking-[0.16em] text-[#8ea0bb] uppercase">
                    <span>{slider.leftLabel}</span>
                    <span>{slider.rightLabel}</span>
                  </div>

                  <div className="relative">
                    <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#e7ebf2]" />
                    <div
                      className="pointer-events-none absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-[#2563ff]"
                      style={{ width: `${currentValue}%` }}
                    />

                    <input
                      aria-label={`${slider.leftLabel} to ${slider.rightLabel}`}
                      type="range"
                      min="0"
                      max="100"
                      value={currentValue}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value);
                        setVibeValue(slider.id, nextValue);
                      }}
                      className="v2-vibe-slider relative h-8 w-full cursor-pointer appearance-none bg-transparent"
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
            className="flex w-full items-center justify-center gap-3 rounded-[24px] bg-[#101114] px-6 py-5 text-lg font-bold text-white shadow-[0_18px_36px_rgba(16,17,20,0.22)] transition-transform duration-200 active:scale-[0.985]"
          >
            <span>Continue</span>
            <ArrowRight className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>
      </div>

      <style jsx>{`
        .v2-vibe-slider::-webkit-slider-thumb {
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 9999px;
          background: #ffffff;
          border: 8px solid #ffffff;
          box-shadow:
            0 10px 24px rgba(27, 43, 75, 0.14),
            inset 0 0 0 5px #2563ff;
          margin-top: -12px;
          position: relative;
          z-index: 2;
        }

        .v2-vibe-slider::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 9999px;
          background: #ffffff;
          border: 8px solid #ffffff;
          box-shadow:
            0 10px 24px rgba(27, 43, 75, 0.14),
            inset 0 0 0 5px #2563ff;
        }

        .v2-vibe-slider::-webkit-slider-runnable-track {
          height: 4px;
          background: transparent;
        }

        .v2-vibe-slider::-moz-range-track {
          height: 4px;
          background: transparent;
        }
      `}</style>
    </div>
  );
}
