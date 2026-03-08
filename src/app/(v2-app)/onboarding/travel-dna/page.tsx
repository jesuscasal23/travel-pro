"use client";

import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/v2/OnboardingShell";
import { CloudSun } from "lucide-react";

const bulletPoints = [
  "Personalized recommendations based on your preferences",
  "Itineraries crafted to match your travel DNA",
  "Better suggestions with every trip",
];

export default function TravelDnaPage() {
  const router = useRouter();

  return (
    <OnboardingShell
      ctaLabel="BUILD MY TRAVEL DNA"
      onCtaClick={() => router.push("/onboarding/about-you")}
    >
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
          <CloudSun className="text-v2-orange h-8 w-8" />
        </div>

        <h1 className="text-v2-navy mt-6 text-3xl leading-tight font-bold">
          Your travel style is
          <br />
          <span className="text-v2-orange">unique</span>
        </h1>

        <p className="text-v2-text-muted mt-3 text-sm">
          Answer a few questions so we can tailor every trip to you.
        </p>

        <ul className="text-v2-navy mt-8 space-y-4 text-left text-sm">
          {bulletPoints.map((point) => (
            <li key={point} className="flex items-start gap-3">
              <span className="bg-v2-orange mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </OnboardingShell>
  );
}
