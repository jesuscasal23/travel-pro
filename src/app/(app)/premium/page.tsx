"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Search, Bell, Sparkles, ShieldOff, Check } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useToastStore } from "@/stores/useToastStore";

type Plan = "monthly" | "annual";

const features = [
  { icon: Search, title: "Unlimited flight & hotel searches" },
  { icon: Bell, title: "Real-time smart price alerts" },
  { icon: Sparkles, title: "Exclusive member-only deals" },
  { icon: ShieldOff, title: "Completely ad-free experience" },
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
    selectedPlan === "annual" ? "Start Free Trial — $69.99/yr" : "Start Free Trial — $9.99/mo";

  return (
    <div className="relative flex h-dvh flex-col">
      {/* Hero gradient */}
      <div className="from-brand-primary via-app-indigo to-app-violet relative shrink-0 overflow-hidden bg-gradient-to-br px-6 pt-10 pb-8 text-white">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Crown size={28} strokeWidth={1.8} />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Unlock the full experience
          </h1>
          <p className="mt-1.5 text-sm text-white/75">
            Travel smarter with powerful tools built for explorers
          </p>
        </div>
      </div>

      {/* Content — no scroll */}
      <div className="dark:bg-background flex flex-1 flex-col justify-between bg-white px-6 pt-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        {/* Feature list */}
        <div className="space-y-3">
          {features.map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <div className="bg-brand-primary-soft dark:bg-brand-primary/15 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                <f.icon size={18} className="text-brand-primary" strokeWidth={2} />
              </div>
              <p className="text-ink text-[14px] font-semibold dark:text-white">{f.title}</p>
            </div>
          ))}
        </div>

        {/* Pricing + CTA + footer */}
        <div>
          {/* Pricing cards */}
          <div className="mt-6 space-y-2.5">
            <PlanCard
              label="Annual"
              price="$69.99"
              period="/yr"
              badge="Best Value"
              subtitle="$5.83/mo — save 42%"
              selected={selectedPlan === "annual"}
              onSelect={() => setSelectedPlan("annual")}
            />
            <PlanCard
              label="Monthly"
              price="$9.99"
              period="/mo"
              selected={selectedPlan === "monthly"}
              onSelect={() => setSelectedPlan("monthly")}
            />
          </div>

          {/* CTA */}
          <button
            onClick={handleSubscribe}
            className="shadow-brand-sm bg-brand-primary mt-5 w-full rounded-2xl px-6 py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90 active:opacity-80"
          >
            {ctaText}
          </button>
          <p className="text-dim mt-1.5 text-center text-[11px] dark:text-white/40">
            7-day free trial, cancel anytime
          </p>

          {/* Footer links */}
          <div className="text-label mt-4 flex items-center justify-center gap-3 text-[11px] dark:text-white/40">
            <button
              onClick={handleRestore}
              className="hover:text-dim underline underline-offset-2 transition-colors"
            >
              Restore Purchase
            </button>
            <span>·</span>
            <Link href="/privacy" className="hover:text-dim underline underline-offset-2">
              Terms
            </Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-dim underline underline-offset-2">
              Privacy
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
      className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all ${
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
