"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CloudSun,
  Globe2,
  Sparkles,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

type FloatingCard = {
  label: string;
  caption: string;
  icon: LucideIcon;
  className: string;
  iconClassName: string;
};

const floatingCards: FloatingCard[] = [
  {
    label: "Visa",
    caption: "ENTRY RULES",
    icon: Globe2,
    className: "left-7 top-9 -rotate-[12deg]",
    iconClassName: "text-brand-primary",
  },
  {
    label: "Hotels",
    caption: "STAYS",
    icon: Building2,
    className: "right-7 top-12 rotate-[9deg]",
    iconClassName: "text-[#6366f1]",
  },
  {
    label: "Weather",
    caption: "FORECAST",
    icon: CloudSun,
    className: "bottom-11 left-5 -rotate-[4deg]",
    iconClassName: "text-[#3b82f6]",
  },
  {
    label: "Budget",
    caption: "SPEND PLAN",
    icon: WalletCards,
    className: "bottom-4 right-7 rotate-[14deg]",
    iconClassName: "text-[#10b981]",
  },
];

export default function V2LandingPage() {
  const router = useRouter();
  const { canInstall, install } = useInstallPrompt();

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f6f8fb_55%,#eef2f7_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-[-8rem] h-72 bg-[radial-gradient(circle_at_top,var(--brand-primary-glow)_0%,transparent_62%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(circle_at_bottom,#1b2b4b10_0%,transparent_60%)]" />

      <div className="relative flex min-h-dvh flex-col">
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <header className="px-2 pt-7 text-center">
            <p className="text-brand-primary font-display text-[11px] font-bold tracking-[0.34em] uppercase">
              Welcome to Travel Pro
            </p>
            <h1 className="font-display mt-5 text-[2.85rem] leading-[0.95] font-bold tracking-[-0.05em] text-[#101114]">
              Your dream trip,
              <br />
              <span className="text-brand-primary">effortlessly.</span>
            </h1>
          </header>

          <section className="relative mx-auto mt-12 h-[292px] w-full max-w-[340px]">
            <div className="absolute inset-x-10 bottom-7 h-20 rounded-full bg-[#1b2b4b12] blur-3xl" />

            {floatingCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className={`absolute z-10 flex h-28 w-40 flex-col justify-between rounded-[30px] border border-white/80 bg-white/88 p-4 shadow-[0_18px_40px_rgba(27,43,75,0.08)] backdrop-blur-sm ${card.className}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4f7fb] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <Icon className={`h-5 w-5 ${card.iconClassName}`} strokeWidth={2.2} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold tracking-[-0.01em] text-[#516079]">
                      {card.label}
                    </p>
                    <p className="mt-1 text-[10px] font-bold tracking-[0.22em] text-[#a3adbc] uppercase">
                      {card.caption}
                    </p>
                  </div>
                </div>
              );
            })}

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative z-20 flex h-40 w-28 flex-col items-center justify-center rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,#132754_0%,#091327_100%)] shadow-[0_24px_60px_rgba(8,19,39,0.34)]">
                <div className="absolute inset-x-4 top-3 h-10 rounded-full bg-[#3b82f624] blur-xl" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-3xl bg-[#0e1f46] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <Sparkles className="h-7 w-7 text-[#52a3ff]" strokeWidth={2.2} />
                </div>
                <div className="relative mt-3 text-center">
                  <p className="text-[12px] font-bold tracking-[0.28em] text-white uppercase">
                    Magic
                  </p>
                  <p className="mt-1 text-[10px] tracking-[0.18em] text-[#8ea3c5] uppercase">
                    Planning OS
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="pt-6">
            <p className="mx-auto max-w-[320px] text-center text-[15px] leading-7 text-[#6d7b91]">
              Stop researching, start traveling. We handle the complexity, you enjoy the journey.
            </p>
          </div>
        </div>

        <div className="shrink-0 px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => router.push("/get-started/advantage")}
            className="bg-brand-primary flex w-full items-center justify-center gap-3 rounded-[24px] px-6 py-5 text-lg font-bold text-white shadow-[var(--shadow-brand-xl)] transition-transform duration-200 active:scale-[0.985]"
          >
            <span>Start Planning</span>
            <ArrowRight className="h-5 w-5" strokeWidth={2.4} />
          </button>

          <p className="mt-4 text-center text-sm text-[#6d7b91]">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>

          {canInstall ? (
            <button
              type="button"
              onClick={() => {
                void install();
              }}
              className="mx-auto mt-3 block text-sm font-semibold text-[#6d7b91] transition-colors hover:text-[#1b2b4b]"
            >
              Install app
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
