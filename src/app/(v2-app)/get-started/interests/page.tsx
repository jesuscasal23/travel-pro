"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Camera,
  Coffee,
  Globe2,
  Mountain,
  Music4,
  SunMedium,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { useTripStore } from "@/stores/useTripStore";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { BackButton } from "@/components/ui/BackButton";

type InterestCard = {
  id: string;
  icon: LucideIcon;
  iconClassName: string;
  surfaceClassName: string;
};

const interestCards: InterestCard[] = [
  {
    id: "surfing",
    icon: Waves,
    iconClassName: "text-[#3b82ff]",
    surfaceClassName: "bg-[#edf4ff]",
  },
  {
    id: "food",
    icon: UtensilsCrossed,
    iconClassName: "text-[#f97316]",
    surfaceClassName: "bg-[#fff3e8]",
  },
  {
    id: "culture",
    icon: Globe2,
    iconClassName: "text-[#6b5cff]",
    surfaceClassName: "bg-[#f0efff]",
  },
  {
    id: "hiking",
    icon: Mountain,
    iconClassName: "text-[#10b981]",
    surfaceClassName: "bg-[#e8f8f1]",
  },
  {
    id: "nightlife",
    icon: Music4,
    iconClassName: "text-[#ff4b7a]",
    surfaceClassName: "bg-[#ffeef3]",
  },
  {
    id: "relaxation",
    icon: Coffee,
    iconClassName: "text-[#f59e0b]",
    surfaceClassName: "bg-[#fff8e8]",
  },
  {
    id: "nature",
    icon: SunMedium,
    iconClassName: "text-[#36a3ff]",
    surfaceClassName: "bg-[#eef7ff]",
  },
  {
    id: "photography",
    icon: Camera,
    iconClassName: "text-[#8b5cf6]",
    surfaceClassName: "bg-[#f3efff]",
  },
];

const labels: Record<string, string> = {
  surfing: "Surfing",
  food: "Food",
  culture: "Culture",
  hiking: "Hiking",
  nightlife: "Nightlife",
  relaxation: "Relaxation",
  nature: "Nature",
  photography: "Photography",
};

export default function V2InterestsPage() {
  const router = useRouter();
  const interests = useTripStore((s) => s.interests);
  const toggleInterest = useTripStore((s) => s.toggleInterest);

  return (
    <GradientBackground>
      <div className="relative flex h-dvh flex-col">
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="pt-6">
            <BackButton href="/get-started/vibe" />
          </div>

          <header className="pt-4">
            <p className="text-brand-primary font-display text-[11px] font-bold tracking-[0.34em] uppercase">
              Interests
            </p>
            <h1 className="font-display text-v2-dark mt-3 text-[2.35rem] leading-[1.02] font-bold tracking-[-0.05em]">
              What excites you?
            </h1>
            <p className="text-v2-text-muted mt-3 max-w-[320px] text-[15px] leading-7">
              Select the experiences that make a trip memorable for you.
            </p>
          </header>

          <section className="grid grid-cols-3 gap-3 pt-8">
            {interestCards.map((interest) => {
              const Icon = interest.icon;
              const isSelected = interests.includes(interest.id);

              return (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => toggleInterest(interest.id)}
                  aria-pressed={isSelected}
                  className={`group flex aspect-square flex-col items-center justify-center gap-3 rounded-3xl transition-all duration-200 hover:scale-[1.05] active:scale-[0.95] ${
                    isSelected
                      ? `${interest.surfaceClassName} ring-brand-primary shadow-[var(--shadow-brand-md)] ring-2`
                      : `${interest.surfaceClassName} hover:shadow-md`
                  }`}
                >
                  <Icon className={`h-9 w-9 ${interest.iconClassName}`} strokeWidth={1.8} />
                  <span className="text-[11px] font-bold tracking-[0.06em] text-[#314158] uppercase">
                    {labels[interest.id]}
                  </span>
                </button>
              );
            })}
          </section>
        </div>

        <div className="shrink-0 px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => router.push("/get-started/budget")}
            disabled={interests.length === 0}
            className={`flex w-full items-center justify-center gap-3 rounded-[24px] px-6 py-5 text-lg font-bold text-white transition-transform duration-200 active:scale-[0.985] ${
              interests.length === 0
                ? "cursor-not-allowed bg-[#a3a3a3] shadow-none"
                : "bg-v2-dark shadow-dark-cta"
            }`}
          >
            <span>Continue</span>
            <ArrowRight className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </GradientBackground>
  );
}
