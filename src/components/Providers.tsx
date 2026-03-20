"use client";

import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { useToastStore } from "@/stores/useToastStore";
import { useTripStore } from "@/stores/useTripStore";
import { ToastContainer } from "@/components/ui/Toast";
import type { Itinerary } from "@/types";
import type { PostHog } from "posthog-js";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/hooks/api/keys";

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
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        useTripStore.getState().resetAll();
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.status });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

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
