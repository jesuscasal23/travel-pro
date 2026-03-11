"use client";

import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/v2/OnboardingShell";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Button } from "@/components/v2/ui/Button";

export default function V2LandingPage() {
  const router = useRouter();
  const { canInstall, install } = useInstallPrompt();

  const cards = [
    {
      label: "Weather",
      bg: "bg-blue-500",
      rotate: "-rotate-12",
      pos: "-translate-x-24 -translate-y-6",
    },
    {
      label: "Accommodation",
      bg: "bg-green-500",
      rotate: "rotate-6",
      pos: "-translate-x-16 translate-y-8",
    },
    {
      label: "Budget",
      bg: "bg-purple-500",
      rotate: "-rotate-6",
      pos: "translate-x-16 -translate-y-10",
    },
    {
      label: "Flights",
      bg: "bg-orange-500",
      rotate: "rotate-12",
      pos: "translate-x-24 translate-y-6",
    },
    {
      label: "Spreadsheets",
      bg: "bg-teal-500",
      rotate: "-rotate-3",
      pos: "-translate-x-8 -translate-y-16",
    },
  ];

  return (
    <OnboardingShell
      ctaLabel="START PLANNING"
      onCtaClick={() => router.push("/plan")}
      aboveCta={
        canInstall ? (
          <Button variant="outline" onClick={install} className="mb-3">
            <span className="flex items-center justify-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
              Install App
            </span>
          </Button>
        ) : null
      }
    >
      <div className="flex flex-col items-center pt-8">
        <h1 className="text-v2-navy text-center text-3xl leading-tight font-bold">
          Planning trips shouldn&apos;t
          <br />
          <span className="text-v2-orange">require 20 tabs</span>
        </h1>

        <div className="relative mt-16 flex items-center justify-center" style={{ height: 280 }}>
          {/* Scattered app cards */}
          {cards.map((card) => (
            <div
              key={card.label}
              className={`absolute ${card.bg} ${card.rotate} ${card.pos} rounded-lg px-3 py-2 text-xs font-semibold text-white shadow-md`}
            >
              {card.label}
            </div>
          ))}

          {/* Center phone */}
          <div className="bg-v2-navy border-v2-navy/20 relative z-10 flex h-48 w-24 items-center justify-center rounded-2xl border-2 shadow-xl">
            <span className="text-center text-sm leading-tight font-bold text-white">
              One
              <br />
              App
            </span>
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}
