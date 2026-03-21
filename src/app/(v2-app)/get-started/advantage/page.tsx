"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Check,
  Globe2,
  Map,
  Plane,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { BackButton } from "@/components/ui/BackButton";

type AdvantageItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const advantages: AdvantageItem[] = [
  {
    title: "Visa & Entry",
    description: "Requirements handled automatically",
    icon: Globe2,
  },
  {
    title: "Smart Routes",
    description: "The fastest, cheapest ways to get there",
    icon: Plane,
  },
  {
    title: "Curated Stays",
    description: "Hotels that match your unique style",
    icon: Building2,
  },
  {
    title: "Budget Control",
    description: "Real-time estimates and tracking",
    icon: WalletCards,
  },
  {
    title: "Live Itinerary",
    description: "Day-by-day plans that adapt to you",
    icon: Map,
  },
];

export default function V2AdvantagePage() {
  const router = useRouter();

  return (
    <GradientBackground showBottomGlow={false}>
      <div className="relative flex h-dvh flex-col">
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="pt-6">
            <BackButton href="/get-started" />
          </div>

          <header className="px-2 pt-4 text-center">
            <p className="text-brand-primary font-display text-[11px] font-bold tracking-[0.34em] uppercase">
              The Travel Pro Advantage
            </p>
            <h1 className="font-display text-v2-dark mt-4 text-[2.45rem] leading-[0.98] font-bold tracking-[-0.05em]">
              Everything in
              <br />
              <span className="text-brand-primary">one place</span>
            </h1>
            <p className="text-v2-text-muted mx-auto mt-4 max-w-[280px] text-[15px] leading-7">
              We orchestrate every detail so you can focus on making memories.
            </p>
          </header>

          <section className="mt-6 space-y-3">
            {advantages.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="shadow-glass flex items-center gap-3 rounded-[28px] border border-white/80 bg-white/88 px-4 py-3.5 backdrop-blur-sm"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#eff4fb]">
                    <Icon className="text-brand-primary h-6 w-6" strokeWidth={2.1} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-v2-heading text-[16px] font-semibold tracking-[-0.02em]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[10px] font-bold tracking-[0.18em] text-[#9babc1] uppercase">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dbf4e8]">
                    <Check className="h-4 w-4 text-[#47bc84]" strokeWidth={2.8} />
                  </div>
                </article>
              );
            })}
          </section>
        </div>

        <div className="shrink-0 px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => router.push("/get-started/personalization")}
            className="bg-v2-dark shadow-dark-cta flex w-full items-center justify-center gap-3 rounded-[24px] px-6 py-5 text-lg font-bold text-white transition-transform duration-200 active:scale-[0.985]"
          >
            <span>Sounds Perfect</span>
            <ArrowRight className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </GradientBackground>
  );
}
