"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

const highlights = [
  "Tailored to your pace and budget",
  "Itineraries that match your interests",
  "Gets smarter with every journey",
];

export default function V2PersonalizationPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f6f8fb_55%,#eef2f7_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-[-8rem] h-72 bg-[radial-gradient(circle_at_top,#2563ff14_0%,transparent_62%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(circle_at_bottom,#1b2b4b10_0%,transparent_60%)]" />

      <div className="relative flex min-h-dvh flex-col">
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="pt-6">
            <button
              type="button"
              onClick={() => router.push("/get-started/advantage")}
              aria-label="Go back"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 text-[#8aa0c0] shadow-[0_12px_30px_rgba(27,43,75,0.08)] backdrop-blur-sm transition-colors hover:text-[#1b2b4b]"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
            </button>
          </div>

          <section className="flex min-h-full flex-col items-center px-4 pt-8 text-center">
            <div className="flex h-[98px] w-[98px] items-center justify-center rounded-[28px] bg-[#2563ff] shadow-[0_24px_48px_rgba(37,99,255,0.24)]">
              <Sparkles className="h-12 w-12 text-white" strokeWidth={2.1} />
            </div>

            <p className="font-display mt-6 text-[11px] font-bold tracking-[0.34em] text-[#2563ff] uppercase">
              Personalization Engine
            </p>

            <h1 className="font-display mt-4 text-[2.55rem] leading-[1.02] font-bold tracking-[-0.05em] text-[#101114]">
              Your travel style
              <br />
              is <span className="text-[#2563ff]">unique</span>
            </h1>

            <p className="mt-4 max-w-[290px] text-[15px] leading-7 text-[#6d7b91]">
              Let&apos;s build your Travel DNA to ensure every recommendation feels like it was made
              just for you.
            </p>

            <ul className="mt-8 w-full max-w-[280px] space-y-3 text-left">
              {highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-3">
                  <span className="mt-[0.4rem] h-2.5 w-2.5 shrink-0 rounded-full bg-[#2563ff]" />
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
            className="flex w-full items-center justify-center gap-3 rounded-[24px] bg-[#2563ff] px-6 py-5 text-lg font-bold text-white shadow-[0_18px_34px_rgba(37,99,255,0.28)] transition-transform duration-200 active:scale-[0.985]"
          >
            <span>Build My Travel DNA</span>
            <ArrowRight className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}
