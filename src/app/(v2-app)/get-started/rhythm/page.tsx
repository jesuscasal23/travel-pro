"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Check, Compass, CupSoda, Zap, type LucideIcon } from "lucide-react";
import { useTripStore } from "@/stores/useTripStore";
import { GradientBackground } from "@/components/v2/ui/GradientBackground";
import { BackButton } from "@/components/v2/ui/BackButton";
import type { ActivityPace } from "@/types";

type RhythmOption = {
  id: ActivityPace;
  title: string;
  description: string;
  icon: LucideIcon;
};

const rhythmOptions: RhythmOption[] = [
  {
    id: "active",
    title: "The Sprinter",
    description: "Visit many places, packed itinerary. See as much as possible.",
    icon: Zap,
  },
  {
    id: "moderate",
    title: "The Wanderer",
    description: "A perfect mix of sightseeing and relaxation throughout the trip.",
    icon: Compass,
  },
  {
    id: "relaxed",
    title: "The Soul Searcher",
    description: "Deep experiences, immersive stays. Quality time over quantity.",
    icon: CupSoda,
  },
];

export default function V2RhythmPage() {
  const router = useRouter();
  const pace = useTripStore((s) => s.pace);
  const setPace = useTripStore((s) => s.setPace);

  return (
    <GradientBackground>
      <div className="relative flex h-dvh flex-col">
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="pt-6">
            <BackButton href="/get-started/budget" />
          </div>

          <header className="pt-4">
            <p className="text-brand-primary font-display text-[11px] font-bold tracking-[0.34em] uppercase">
              Your Rhythm
            </p>
            <h1 className="font-display mt-3 text-[2.35rem] leading-[1.02] font-bold tracking-[-0.05em] text-[#101114]">
              What&apos;s your rhythm?
            </h1>
            <p className="text-v2-text-muted mt-3 max-w-[320px] text-[15px] leading-7">
              Every traveler has a beat. Let&apos;s find yours to craft the perfect flow.
            </p>
          </header>

          <section className="space-y-3 pt-8">
            {rhythmOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = option.id === pace;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPace(option.id)}
                  aria-pressed={isSelected}
                  className={`flex w-full items-center gap-4 rounded-[30px] px-4 py-4 text-left transition-all ${
                    isSelected
                      ? "border-brand-primary-border-strong border bg-white text-[#17181c] shadow-[var(--shadow-brand-md)]"
                      : "border border-transparent bg-white/70 text-[#17181c]"
                  }`}
                >
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                      isSelected ? "bg-brand-primary" : "bg-[#f2f5fa]"
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${isSelected ? "text-white" : "text-[#97a8bf]"}`}
                      strokeWidth={2.1}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold tracking-[-0.02em] text-[#2a3242]">
                      {option.title}
                    </p>
                    <p className="mt-1 text-[12px] font-medium text-[#9aacbf]">
                      {option.description}
                    </p>
                  </div>

                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      isSelected ? "bg-brand-primary" : "bg-transparent"
                    }`}
                  >
                    {isSelected ? <Check className="h-4 w-4 text-white" strokeWidth={3} /> : null}
                  </div>
                </button>
              );
            })}
          </section>
        </div>

        <div className="shrink-0 px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => router.push("/plan")}
            className="flex w-full items-center justify-center gap-3 rounded-[24px] bg-[#101114] px-6 py-5 text-lg font-bold text-white shadow-[0_18px_36px_rgba(16,17,20,0.22)] transition-transform duration-200 active:scale-[0.985]"
          >
            <span>Continue</span>
            <ArrowRight className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </GradientBackground>
  );
}
