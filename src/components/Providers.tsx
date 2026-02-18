"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect, useState, type ReactNode } from "react";
import { CookieConsent } from "./CookieConsent";

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
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    initPostHog();
  }, []);

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (key) {
    return (
      <PostHogProvider client={posthog}>
        <QueryClientProvider client={queryClient}>
          {children}
          <CookieConsent />
        </QueryClientProvider>
      </PostHogProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <CookieConsent />
    </QueryClientProvider>
  );
}
