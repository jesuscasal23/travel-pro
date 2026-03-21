"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, type LucideIcon, Gem, Scale, Sparkles, Backpack } from "lucide-react";
import { useTripStore } from "@/stores/useTripStore";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { BackButton } from "@/components/ui/BackButton";
import type { TravelStyle } from "@/types";

type BudgetOption = {
  id: TravelStyle;
  title: string;
  price: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
};

const budgetOptions: BudgetOption[] = [
  {
    id: "backpacker",
    title: "Backpacker",
    price: "$20-40/DAY",
    description: "Hostels, street food, local transport",
    icon: Backpack,
    iconClassName: "text-[#ef4444]",
  },
  {
    id: "smart-budget",
    title: "Smart Budget",
    price: "$50-100/DAY",
    description: "Mid-range hotels, restaurants, tours",
    icon: Scale,
    iconClassName: "text-[#b59a32]",
  },
  {
    id: "comfort-explorer",
    title: "Comfort Explorer",
    price: "$150-300/DAY",
    description: "Boutique hotels, fine dining, experiences",
    icon: Sparkles,
    iconClassName: "text-[#eab308]",
  },
  {
    id: "luxury",
    title: "Luxury Traveler",
    price: "$300+/DAY",
    description: "5-star resorts, private experiences",
    icon: Gem,
    iconClassName: "text-[#38bdf8]",
  },
];

export default function BudgetPage() {
  const router = useRouter();
  const travelStyle = useTripStore((s) => s.travelStyle);
  const setTravelStyle = useTripStore((s) => s.setTravelStyle);

  return (
    <GradientBackground>
      <div className="relative flex h-dvh flex-col">
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="pt-6">
            <BackButton href="/get-started/interests" />
          </div>

          <header className="pt-4">
            <p className="text-brand-primary font-display text-[11px] font-bold tracking-[0.34em] uppercase">
              Budget
            </p>
            <h1 className="font-display text-ink mt-3 text-[2.35rem] leading-[1.02] font-bold tracking-[-0.05em]">
              Plan your spend
            </h1>
            <p className="text-dim mt-3 max-w-[320px] text-[15px] leading-7">
              We&apos;ll tailor every recommendation to your comfort zone.
            </p>
          </header>

          <section className="space-y-3 pt-8">
            {budgetOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = option.id === travelStyle;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTravelStyle(option.id)}
                  aria-pressed={isSelected}
                  className={`flex w-full items-center gap-4 rounded-[30px] border px-4 py-4 text-left transition-all ${
                    isSelected
                      ? "bg-brand-primary border-transparent text-white shadow-[var(--shadow-brand-xl)]"
                      : "text-heading shadow-glass border-white/80 bg-white/88 backdrop-blur-sm"
                  }`}
                >
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                      isSelected ? "bg-white/12" : "bg-[#f1f5fb]"
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${isSelected ? "text-white" : option.iconClassName}`}
                      strokeWidth={2.1}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p
                        className={`text-[16px] font-semibold tracking-[-0.02em] ${isSelected ? "text-white" : "text-heading"}`}
                      >
                        {option.title}
                      </p>
                      <span
                        className={`text-[12px] font-bold tracking-[0.02em] ${isSelected ? "text-white" : "text-brand-primary"}`}
                      >
                        {option.price}
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-[12px] font-medium ${isSelected ? "text-white/80" : "text-label"}`}
                    >
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </section>
        </div>

        <div className="shrink-0 px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => router.push("/get-started/rhythm")}
            className="bg-ink shadow-dark-cta flex w-full items-center justify-center gap-3 rounded-[24px] px-6 py-5 text-lg font-bold text-white transition-transform duration-200 active:scale-[0.985]"
          >
            <span>Continue</span>
            <ArrowRight className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </GradientBackground>
  );
}
