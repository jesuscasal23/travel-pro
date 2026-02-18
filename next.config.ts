import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js App Router requires unsafe-inline; unsafe-eval needed in dev
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Tailwind v4 and Next.js inject inline styles
      "style-src 'self' 'unsafe-inline'",
      // Mapbox tiles, Mapbox Static Images API (for PDF), local assets
      "img-src 'self' data: blob: https://*.mapbox.com https://*.maplibre.org https://api.mapbox.com",
      // External API connections
      [
        "connect-src 'self'",
        "https://api.mapbox.com",
        "https://events.mapbox.com",
        "https://*.supabase.co",
        "https://api.open-meteo.com",
        // PostHog analytics (EU region)
        "https://eu.posthog.com",
        "https://eu-assets.i.posthog.com",
        // Sentry error reporting (*.de.sentry.io for EU region ingest)
        "https://*.sentry.io",
        "https://*.de.sentry.io",
        "https://sentry.io",
        // Resend email (server-side only, but include for CSP completeness)
        "https://api.resend.com",
      ].join(" "),
      // MapLibre GL uses Web Workers via blob: URLs
      "worker-src blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "frame-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },

  // PostHog rewrites to avoid ad blockers (optional but recommended)
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.posthog.com/:path*",
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Upload source maps during Vercel build (SENTRY_AUTH_TOKEN must be set)
  silent: !process.env.CI,
  // Automatically tree-shake Sentry logger in production
  disableLogger: true,
  // Hide source maps from the public bundle after upload
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
