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
    iconClassName: "text-app-blue",
    surfaceClassName: "bg-app-blue/10",
  },
  {
    id: "food",
    icon: UtensilsCrossed,
    iconClassName: "text-app-orange",
    surfaceClassName: "bg-app-orange/10",
  },
  {
    id: "culture",
    icon: Globe2,
    iconClassName: "text-app-violet",
    surfaceClassName: "bg-app-violet/10",
  },
  {
    id: "hiking",
    icon: Mountain,
    iconClassName: "text-app-green",
    surfaceClassName: "bg-app-green/10",
  },
  {
    id: "nightlife",
    icon: Music4,
    iconClassName: "text-app-rose",
    surfaceClassName: "bg-app-rose/10",
  },
  {
    id: "relaxation",
    icon: Coffee,
    iconClassName: "text-app-amber",
    surfaceClassName: "bg-app-amber/10",
  },
  {
    id: "nature",
    icon: SunMedium,
    iconClassName: "text-app-light-blue",
    surfaceClassName: "bg-app-light-blue/10",
  },
  {
    id: "photography",
    icon: Camera,
    iconClassName: "text-app-purple",
    surfaceClassName: "bg-app-purple/10",
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

export default function InterestsPage() {
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
            <h1 className="font-display text-ink mt-3 text-[2.35rem] leading-[1.02] font-bold tracking-[-0.05em]">
              What excites you?
            </h1>
            <p className="text-dim mt-3 max-w-[320px] text-[15px] leading-7">
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
                  <span className="text-prose text-[11px] font-bold tracking-[0.06em] uppercase">
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
                ? "bg-disabled cursor-not-allowed shadow-none"
                : "bg-ink shadow-dark-cta"
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
