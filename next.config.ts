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
      // Next.js App Router requires unsafe-inline; unsafe-eval only needed in dev (HMR/Fast Refresh)
      // eu-assets.i.posthog.com: PostHog loads survey.js and other bundles from its CDN
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://eu-assets.i.posthog.com`,
      // Tailwind v4 and Next.js inject inline styles
      "style-src 'self' 'unsafe-inline'",
      // Mapbox tiles, CARTO basemap sprites/glyphs, local assets
      "img-src 'self' data: blob: https://*.mapbox.com https://*.maplibre.org https://api.mapbox.com https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com",
      // External API connections
      [
        "connect-src 'self'",
        // MapLibre GL loads its WASM module via a data: URI
        "data:",
        "https://api.mapbox.com",
        "https://events.mapbox.com",
        "https://*.supabase.co",
        "https://api.open-meteo.com",
        // PostHog analytics (EU region)
        // eu.posthog.com: main API / rewrites proxy target
        // eu.i.posthog.com: SDK data ingestion endpoint (flags, capture, etc.)
        // eu-assets.i.posthog.com: PostHog static assets / survey bundles
        "https://eu.posthog.com",
        "https://eu.i.posthog.com",
        "https://eu-assets.i.posthog.com",
        // Sentry error reporting (*.de.sentry.io for EU region ingest)
        "https://*.sentry.io",
        "https://*.de.sentry.io",
        "https://sentry.io",
        // Resend email (server-side only, but include for CSP completeness)
        "https://api.resend.com",
        // CARTO basemap tiles (used by MapLibre RouteMap — style JSON + vector tiles)
        "https://basemaps.cartocdn.com",
        "https://*.basemaps.cartocdn.com",
        // Amadeus flight search API (sandbox + production)
        "https://test.api.amadeus.com",
        "https://api.amadeus.com",
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
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
  // Hide source maps from the public bundle after upload
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
