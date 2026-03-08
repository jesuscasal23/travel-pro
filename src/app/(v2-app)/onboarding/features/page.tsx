"use client";

import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/v2/OnboardingShell";
import { Globe, Plane, Building, Wallet, CalendarDays, Check } from "lucide-react";

const features = [
  {
    icon: Globe,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    title: "Visa & Entry",
    subtitle: "Requirements handled",
  },
  {
    icon: Plane,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    title: "Flights",
    subtitle: "Best routes found",
  },
  {
    icon: Building,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
    title: "Accommodation",
    subtitle: "Perfect stays curated",
  },
  {
    icon: Wallet,
    iconBg: "bg-green-50",
    iconColor: "text-green-500",
    title: "Budget Tracking",
    subtitle: "Stay on target",
  },
  {
    icon: CalendarDays,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-500",
    title: "Itinerary",
    subtitle: "Day-by-day planning",
  },
];

export default function FeaturesPage() {
  const router = useRouter();

  return (
    <OnboardingShell ctaLabel="CONTINUE" onCtaClick={() => router.push("/onboarding/travel-dna")}>
      <div>
        <h1 className="text-v2-navy text-3xl leading-tight font-bold">
          Everything in
          <br />
          <span className="text-v2-orange">one place</span>
        </h1>
        <p className="text-v2-text-muted mt-2 text-sm">
          TravelOS handles the complexity so you can focus on the experience.
        </p>

        <div className="mt-8 space-y-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="border-v2-border flex items-center gap-4 rounded-xl border bg-white px-5 py-4"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${feature.iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${feature.iconColor}`} />
                </div>
                <div className="flex-1">
                  <p className="text-v2-navy text-sm font-semibold">{feature.title}</p>
                  <p className="text-v2-text-muted text-xs">{feature.subtitle}</p>
                </div>
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-50">
                  <Check className="text-v2-green h-3.5 w-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </OnboardingShell>
  );
}
