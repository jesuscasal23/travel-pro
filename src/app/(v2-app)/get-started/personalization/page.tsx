"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { GradientBackground } from "@/components/v2/ui/GradientBackground";
import { BackButton } from "@/components/v2/ui/BackButton";

const highlights = [
  "Tailored to your pace and budget",
  "Itineraries that match your interests",
  "Gets smarter with every journey",
];

export default function V2PersonalizationPage() {
  const router = useRouter();

  return (
    <GradientBackground>
      <div className="relative flex h-dvh flex-col">
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="pt-6">
            <BackButton href="/get-started/advantage" />
          </div>

          <section className="flex min-h-full flex-col items-center px-4 pt-8 text-center">
            <div className="bg-brand-primary flex h-[98px] w-[98px] items-center justify-center rounded-[28px] shadow-[var(--shadow-brand-lg)]">
              <Sparkles className="h-12 w-12 text-white" strokeWidth={2.1} />
            </div>

            <p className="text-brand-primary font-display mt-6 text-[11px] font-bold tracking-[0.34em] uppercase">
              Personalization Engine
            </p>

            <h1 className="font-display mt-4 text-[2.55rem] leading-[1.02] font-bold tracking-[-0.05em] text-[#101114]">
              Your travel style
              <br />
              is <span className="text-brand-primary">unique</span>
            </h1>

            <p className="text-v2-text-muted mt-4 max-w-[290px] text-[15px] leading-7">
              Let&apos;s build your Travel DNA to ensure every recommendation feels like it was made
              just for you.
            </p>

            <ul className="mt-8 w-full max-w-[280px] space-y-3 text-left">
              {highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-3">
                  <span className="bg-brand-primary mt-[0.4rem] h-2.5 w-2.5 shrink-0 rounded-full" />
                  <span className="text-[15px] leading-6 font-semibold text-[#243247]">
                    {highlight}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="shrink-0 px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => router.push("/get-started/vibe")}
            className="bg-brand-primary flex w-full items-center justify-center gap-3 rounded-[24px] px-6 py-5 text-lg font-bold text-white shadow-[var(--shadow-brand-xl)] transition-transform duration-200 active:scale-[0.985]"
          >
            <span>Build My Travel DNA</span>
            <ArrowRight className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </GradientBackground>
  );
}
