import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[image:var(--gradient-page)]">
      <div className="pointer-events-none absolute inset-x-0 top-[-8rem] h-72 bg-[image:var(--glow-top)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[image:var(--glow-bottom)]" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center px-6 py-10">
        <div className="bg-brand-primary mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[28px] shadow-[var(--shadow-brand-lg)]">
          <Compass className="h-10 w-10 text-white" strokeWidth={2.2} />
        </div>

        <div className="text-center">
          <p className="text-brand-primary font-display text-[11px] font-bold tracking-[0.34em] uppercase">
            Fichi
          </p>
          <h1 className="text-ink mt-4 text-[2.35rem] leading-[1.02] font-bold tracking-[-0.05em]">
            Page not found
          </h1>
          <p className="text-dim mt-3 text-sm leading-7">
            This page doesn&apos;t exist or may have been moved.
            <br />
            Let&apos;s get you somewhere worth going.
          </p>
        </div>

        <div className="mt-10 w-full">
          <Link
            href="/plan"
            className="bg-brand-primary shadow-brand-xl inline-flex w-full items-center justify-center rounded-xl px-6 py-4 text-base font-bold tracking-wide text-white transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
          >
            Start planning
          </Link>
        </div>
      </div>
    </div>
  );
}
