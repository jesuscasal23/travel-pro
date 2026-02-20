"use client";

import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect, useState, type ReactNode } from "react";
import { CookieConsent } from "./CookieConsent";
import { useToastStore } from "@/stores/useToastStore";
import { useTripStore } from "@/stores/useTripStore";
import { ToastContainer } from "@/components/ui/Toast";
import type { Itinerary } from "@/types";

// Initialize PostHog on first client render (consent-gated via CookieConsent)
function initPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.posthog.com";

  if (!key || typeof window === "undefined") return;

  // Check consent cookie before initialising
  const consent = document.cookie
    .split("; ")
    .find((row) => row.startsWith("travel_pro_consent="))
    ?.split("=")[1];

  if (consent !== "accepted") {
    posthog.init(key, { api_host: host, loaded: (ph) => ph.opt_out_capturing() });
    return;
  }

  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false, // Manual events only — we control what we track
    persistence: "localStorage+cookie",
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => {
    const mutationCache = new MutationCache({
      onError: (_error, _variables, context, mutation) => {
        // Rollback Zustand itinerary if previous snapshot exists
        const ctx = context as { previousItinerary?: unknown } | undefined;
        if (ctx?.previousItinerary) {
          useTripStore.getState().setItinerary(ctx.previousItinerary as Itinerary);
        }
        // Show global error toast for mutations that opt-in via meta
        const meta = mutation.options.meta as { errorToast?: string } | undefined;
        if (meta?.errorToast) {
          useToastStore.getState().toast({
            title: "Something went wrong",
            description: meta.errorToast,
            variant: "error",
          });
        }
      },
    });
    return new QueryClient({
      mutationCache,
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          retry: 1,
        },
      },
    });
  });

  useEffect(() => {
    initPostHog();
  }, []);

  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismiss);

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (key) {
    return (
      <PostHogProvider client={posthog}>
        <QueryClientProvider client={queryClient}>
          {children}
          <CookieConsent />
          <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </QueryClientProvider>
      </PostHogProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <CookieConsent />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </QueryClientProvider>
  );
}
