"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  type LucideIcon,
  Gem,
  Scale,
  Sparkles,
  Backpack,
} from "lucide-react";
import { useTripStore } from "@/stores/useTripStore";
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

export default function V2BudgetPage() {
  const router = useRouter();
  const travelStyle = useTripStore((s) => s.travelStyle);
  const setTravelStyle = useTripStore((s) => s.setTravelStyle);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f6f8fb_55%,#eef2f7_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-[-8rem] h-72 bg-[radial-gradient(circle_at_top,var(--brand-primary-glow)_0%,transparent_62%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(circle_at_bottom,#1b2b4b10_0%,transparent_60%)]" />

      <div className="relative flex min-h-dvh flex-col">
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="pt-6">
            <button
              type="button"
              onClick={() => router.push("/get-started/interests")}
              aria-label="Go back"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 text-[#8aa0c0] shadow-[0_12px_30px_rgba(27,43,75,0.08)] backdrop-blur-sm transition-colors hover:text-[#1b2b4b]"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
            </button>
          </div>

          <header className="pt-4">
            <p className="text-brand-primary font-display text-[11px] font-bold tracking-[0.34em] uppercase">
              Budget
            </p>
            <h1 className="font-display mt-3 text-[2.35rem] leading-[1.02] font-bold tracking-[-0.05em] text-[#101114]">
              Plan your spend
            </h1>
            <p className="mt-3 max-w-[320px] text-[15px] leading-7 text-[#6d7b91]">
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
                      : "border-white/80 bg-white/88 text-[#17181c] shadow-[0_16px_36px_rgba(27,43,75,0.08)] backdrop-blur-sm"
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
                        className={`text-[16px] font-semibold tracking-[-0.02em] ${isSelected ? "text-white" : "text-[#17181c]"}`}
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
                      className={`mt-1 text-[12px] font-medium ${isSelected ? "text-white/80" : "text-[#8ea0bb]"}`}
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
            className="flex w-full items-center justify-center gap-3 rounded-[24px] bg-[#101114] px-6 py-5 text-lg font-bold text-white shadow-[0_18px_36px_rgba(16,17,20,0.22)] transition-transform duration-200 active:scale-[0.985]"
          >
            <span>Continue</span>
            <ArrowRight className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}
