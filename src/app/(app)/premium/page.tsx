"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Search, Bell, Sparkles, ShieldOff } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/Badge";
import { useToastStore } from "@/stores/useToastStore";

type Plan = "monthly" | "annual";

const features = [
  {
    icon: Search,
    title: "Unlimited searches",
    description: "Search thousands of flights and hotels without daily restrictions",
  },
  {
    icon: Bell,
    title: "Real-time smart price alerts",
    description: "Get notified the exact second a price drops",
  },
  {
    icon: Sparkles,
    title: "Exclusive member-only deals",
    description: "Access hidden fares and private hotel rates",
  },
  {
    icon: ShieldOff,
    title: "Ad-free experience",
    description: "Zero distractions while you plan your perfect trip",
  },
] as const;

export default function PremiumPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>("annual");
  const toast = useToastStore((s) => s.toast);

  const handleSubscribe = () => {
    toast({ title: "Coming soon", description: "Premium subscriptions are not yet available." });
  };

  const handleRestore = () => {
    toast({ title: "Nothing to restore", description: "No previous purchase found." });
  };

  const ctaText =
    selectedPlan === "annual"
      ? "Start My 7-Day Free Trial — $69.99/yr"
      : "Start My 7-Day Free Trial — $9.99/mo";

  return (
    <div className="relative flex h-dvh flex-col">
      {/* Hero gradient */}
      <div className="from-brand-primary via-app-indigo to-app-violet relative shrink-0 overflow-hidden bg-gradient-to-br px-6 pt-6 pb-10 text-white">
        {/* Back button */}
        <div className="mb-6">
          <BackButton href="/home" />
        </div>

        {/* Premium icon + badge */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Crown size={32} strokeWidth={1.8} />
          </div>
          <Badge variant="brand" className="mb-3 bg-white/20 text-white backdrop-blur-sm">
            PREMIUM
          </Badge>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Unlock the full experience
          </h1>
          <p className="mt-2 text-sm text-white/75">
            Travel smarter with powerful tools built for explorers
          </p>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="dark:bg-background flex-1 overflow-y-auto bg-white">
        {/* Feature bento list */}
        <div className="space-y-3 px-6 pt-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="border-edge/60 dark:border-edge/20 dark:bg-surface-soft/10 flex items-start gap-4 rounded-2xl border bg-white p-4 dark:bg-white/5"
            >
              <div className="bg-brand-primary-soft dark:bg-brand-primary/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <f.icon size={20} className="text-brand-primary" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-ink text-sm font-bold dark:text-white">{f.title}</p>
                <p className="text-dim mt-0.5 text-[13px] leading-snug dark:text-white/60">
                  {f.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing cards */}
        <div className="mt-8 space-y-3 px-6">
          <PlanCard
            label="Annual"
            price="$69.99"
            period="/year"
            badge="Best Value"
            subtitle="$5.83/mo — save 42%"
            selected={selectedPlan === "annual"}
            onSelect={() => setSelectedPlan("annual")}
          />
          <PlanCard
            label="Monthly"
            price="$9.99"
            period="/month"
            selected={selectedPlan === "monthly"}
            onSelect={() => setSelectedPlan("monthly")}
          />
        </div>

        {/* CTA */}
        <div className="mt-8 px-6">
          <button
            onClick={handleSubscribe}
            className="shadow-brand-sm bg-brand-primary w-full rounded-2xl px-6 py-4 text-base font-bold text-white transition-opacity hover:opacity-90 active:opacity-80"
          >
            {ctaText}
          </button>
        </div>

        {/* Footer links */}
        <div className="mt-6 flex flex-col items-center gap-3 px-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <button
            onClick={handleRestore}
            className="text-dim hover:text-ink text-[13px] font-semibold underline underline-offset-2 transition-colors dark:text-white/50"
          >
            Restore Purchase
          </button>
          <div className="text-label flex gap-3 text-[12px] dark:text-white/40">
            <Link href="/privacy" className="hover:text-dim underline underline-offset-2">
              Terms of Service
            </Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-dim underline underline-offset-2">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface PlanCardProps {
  label: string;
  price: string;
  period: string;
  badge?: string;
  subtitle?: string;
  selected: boolean;
  onSelect: () => void;
}

function PlanCard({ label, price, period, badge, subtitle, selected, onSelect }: PlanCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
        selected
          ? "border-brand-primary bg-brand-primary-soft/50 dark:bg-brand-primary/10 shadow-brand-sm/30"
          : "border-edge/60 dark:border-edge/20 hover:border-edge dark:hover:border-edge/40 bg-white dark:bg-white/5"
      }`}
    >
      {/* Radio circle */}
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          selected ? "border-brand-primary bg-brand-primary" : "border-edge dark:border-edge/40"
        }`}
      >
        {selected && <div className="h-2 w-2 rounded-full bg-white" />}
      </div>

      {/* Plan info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-ink text-sm font-bold dark:text-white">{label}</span>
          {badge && (
            <Badge variant="brand" className="text-[9px]">
              {badge}
            </Badge>
          )}
        </div>
        {subtitle && <p className="text-dim mt-0.5 text-[12px] dark:text-white/50">{subtitle}</p>}
      </div>

      {/* Price */}
      <div className="text-right">
        <span className="text-ink text-lg font-bold dark:text-white">{price}</span>
        <span className="text-dim text-[12px] dark:text-white/50">{period}</span>
      </div>
    </button>
  );
}
