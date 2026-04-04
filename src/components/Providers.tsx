"use client";

import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { useToastStore } from "@/stores/useToastStore";
import { useTripStore } from "@/stores/useTripStore";
import { usePlanFormStore } from "@/stores/usePlanFormStore";
import { ToastContainer } from "@/components/ui/Toast";
import type { PostHog } from "posthog-js";
import type { AuthChangeEvent } from "@supabase/supabase-js";
import { createClient } from "@/lib/core/supabase-client";
import { queryKeys } from "@/hooks/api/keys";
import { shouldRetryQuery } from "@/lib/client/query-retry";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => {
    const mutationCache = new MutationCache({
      onError: (_error, _variables, _context, mutation) => {
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
          retry: (failureCount, error) => shouldRetryQuery(failureCount, error),
        },
      },
    });
  });

  const [phClient, setPhClient] = useState<PostHog | null>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.posthog.com";
    if (!key) return;

    void import("posthog-js").then(({ default: posthog }) => {
      const consent = document.cookie
        .split("; ")
        .find((row) => row.startsWith("travel_pro_consent="))
        ?.split("=")[1];

      if (consent !== "accepted") {
        posthog.init(key, { api_host: host, loaded: (ph) => ph.opt_out_capturing() });
      } else {
        posthog.init(key, {
          api_host: host,
          capture_pageview: true,
          capture_pageleave: true,
          autocapture: false,
          persistence: "localStorage+cookie",
        });
      }

      setPhClient(posthog);
    });
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === "SIGNED_OUT") {
        useTripStore.getState().resetAll();
        usePlanFormStore.getState().resetPlanForm();
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.status });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.feedback.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Register service worker for PWA install prompt + offline support
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration failed — non-critical, app works without it
      });
    }
  }, []);

  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismiss);

  const inner = (
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        {children}
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </QueryClientProvider>
    </MotionConfig>
  );

  if (phClient) {
    // Lazy-load PostHogProvider only once the client is ready
    return <LazyPostHogProvider client={phClient}>{inner}</LazyPostHogProvider>;
  }

  return inner;
}

// Thin wrapper that lazy-loads posthog-js/react
function LazyPostHogProvider({ client, children }: { client: PostHog; children: ReactNode }) {
  const [Provider, setProvider] = useState<React.ComponentType<{
    client: PostHog;
    children: ReactNode;
  }> | null>(null);

  useEffect(() => {
    void import("posthog-js/react").then((mod) => {
      setProvider(() => mod.PostHogProvider);
    });
  }, []);

  if (!Provider) return <>{children}</>;
  return <Provider client={client}>{children}</Provider>;
}
