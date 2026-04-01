"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import {
  Crown,
  Loader2,
  Search,
  Bell,
  Sparkles,
  ShieldOff,
  Infinity,
  CalendarCheck,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useToastStore } from "@/stores/useToastStore";
import { apiFetch } from "@/lib/client/api-fetch";

type Plan = "lifetime" | "yearly" | "per-trip";

const features = [
  { icon: Search, title: "Unlimited flight & hotel searches" },
  { icon: Bell, title: "Real-time smart price alerts" },
  { icon: Sparkles, title: "Exclusive member-only deals" },
  { icon: ShieldOff, title: "Completely ad-free experience" },
] as const;

const PLAN_PRICES: Record<Plan | "monthly", string> = {
  lifetime: "499",
  yearly: "99",
  "per-trip": "19.99",
  monthly: "12.99",
};

export default function PremiumPage() {
  return (
    <Suspense>
      <PremiumPageInner />
    </Suspense>
  );
}

function PremiumPageInner() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>("yearly");
  const [showMonthly, setShowMonthly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToastStore((s) => s.toast);
  const posthog = usePostHog();
  const searchParams = useSearchParams();
  const mountedAt = useRef(0);
  const source = searchParams.get("source");

  // Track paywall view on mount
  useEffect(() => {
    mountedAt.current = Date.now();
    posthog?.capture("paywall_viewed", { source: source ?? "direct" });
  }, [posthog, source]);

  // Track subscription success after Stripe redirect
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      posthog?.capture("subscription_started", {
        plan: searchParams.get("plan") ?? "unknown",
      });
    }
  }, [posthog, searchParams]);

  // Track dismissal via visibilitychange
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        posthog?.capture("paywall_dismissed", {
          source: source ?? "direct",
          time_on_page_ms: Date.now() - mountedAt.current,
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [posthog, source]);

  const handleSubscribe = async () => {
    if (selectedPlan === "per-trip") {
      toast({ title: "Coming soon", description: "Per-trip plans are not yet available." });
      return;
    }

    // When the monthly sub-option is shown and selected, checkout monthly
    const checkoutPlan = showMonthly && selectedPlan === "yearly" ? "monthly" : selectedPlan;

    posthog?.capture("paywall_cta_clicked", {
      plan: checkoutPlan,
      price: PLAN_PRICES[checkoutPlan],
    });

    setIsLoading(true);
    try {
      const data = await apiFetch<{ url: string }>("/api/v1/stripe/checkout", {
        method: "POST",
        source: "PremiumPage",
        body: { plan: checkoutPlan },
        fallbackMessage: "Failed to start checkout",
      });
      window.location.href = data.url;
    } catch (error) {
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
      setIsLoading(false);
    }
  };

  const handleRestore = () => {
    toast({ title: "Nothing to restore", description: "No previous purchase found." });
  };

  const handleSelectYearly = () => {
    setSelectedPlan("yearly");
    setShowMonthly(true);
  };

  const ctaLabel: Record<Plan, string> = {
    lifetime: "Get Lifetime Access",
    yearly: showMonthly ? "Start Free Trial" : "Start Free Trial",
    "per-trip": "Unlock This Trip",
  };

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

      {/* Content */}
      <div className="dark:bg-background flex flex-1 flex-col justify-between overflow-y-auto bg-white px-6 pt-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
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
            {/* Lifetime — psychological anchor */}
            <PlanCard
              icon={Infinity}
              label="Lifetime"
              price="499"
              period=""
              subtitle="One-time payment, forever yours"
              selected={selectedPlan === "lifetime"}
              onSelect={() => {
                setSelectedPlan("lifetime");
                setShowMonthly(false);
              }}
            />

            {/* Yearly — recommended */}
            <PlanCard
              icon={CalendarCheck}
              label="Yearly"
              price="99"
              period="/yr"
              badge="Most Popular"
              subtitle="7-day free trial included"
              selected={selectedPlan === "yearly" && !showMonthly}
              onSelect={handleSelectYearly}
            />

            {/* Monthly — revealed when yearly is selected */}
            {showMonthly && (
              <div className="border-brand-primary/20 ml-6 border-l-2 pl-3">
                <PlanCard
                  label="Monthly"
                  price="12.99"
                  period="/mo"
                  subtitle="Cancel anytime"
                  selected={selectedPlan === "yearly" && showMonthly}
                  onSelect={() => setSelectedPlan("yearly")}
                  compact
                />
              </div>
            )}

            {/* Per trip */}
            <PlanCard
              icon={MapPin}
              label="Per Trip"
              price="19.99"
              period=""
              subtitle="Unlock a single trip"
              selected={selectedPlan === "per-trip"}
              onSelect={() => {
                setSelectedPlan("per-trip");
                setShowMonthly(false);
              }}
            />
          </div>

          {/* CTA */}
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="shadow-brand-sm bg-brand-primary mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
          >
            {isLoading && <Loader2 size={18} className="animate-spin" />}
            {isLoading ? "Redirecting to checkout..." : ctaLabel[selectedPlan]}
          </button>
          {selectedPlan === "yearly" && (
            <p className="text-dim mt-1.5 text-center text-[11px] dark:text-white/40">
              7-day free trial, cancel anytime
            </p>
          )}

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
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  price: string;
  period: string;
  badge?: string;
  subtitle?: string;
  selected: boolean;
  onSelect: () => void;
  compact?: boolean;
}

function PlanCard({
  icon: Icon,
  label,
  price,
  period,
  badge,
  subtitle,
  selected,
  onSelect,
  compact,
}: PlanCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-2xl border-2 text-left transition-all ${
        compact ? "px-3 py-2.5" : "px-4 py-3"
      } ${
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
          {Icon && (
            <Icon
              size={compact ? 14 : 16}
              strokeWidth={2}
              className={selected ? "text-brand-primary" : "text-dim dark:text-white/40"}
            />
          )}
          <span
            className={`text-ink font-bold dark:text-white ${compact ? "text-[13px]" : "text-sm"}`}
          >
            {label}
          </span>
          {badge && (
            <Badge variant="brand" className="text-[9px]">
              {badge}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p
            className={`text-dim dark:text-white/50 ${compact ? "mt-0 text-[11px]" : "mt-0.5 text-[12px]"}`}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="text-right">
        <span className="text-dim text-[12px] dark:text-white/50">&euro;</span>
        <span className={`text-ink font-bold dark:text-white ${compact ? "text-base" : "text-lg"}`}>
          {price}
        </span>
        {period && <span className="text-dim text-[12px] dark:text-white/50">{period}</span>}
      </div>
    </button>
  );
}
