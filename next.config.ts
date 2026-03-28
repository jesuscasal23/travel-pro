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
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://eu-assets.i.posthog.com https://accounts.google.com`,
      // Tailwind v4 and Next.js inject inline styles
      "style-src 'self' 'unsafe-inline'",
      // Carto basemap tiles, local assets
      "img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://images.unsplash.com https://source.unsplash.com https://*.googleusercontent.com https://encrypted-tbn0.gstatic.com",
      // External API connections
      [
        "connect-src 'self'",
        // MapLibre GL loads its WASM module via a data: URI
        "data:",
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
        // Carto basemap tiles (style JSON + vector tiles + glyphs + sprites)
        "https://*.basemaps.cartocdn.com",
        "https://basemaps.cartocdn.com",
        // Google Identity Services (One Tap auth in standalone PWA)
        "https://accounts.google.com",
      ].join(" "),
      // MapLibre GL JS uses Web Workers via blob: URLs
      // 'self' for sw.js registration, blob: for MapLibre GL Web Workers
      "worker-src 'self' blob:",
      "font-src 'self' https://fonts.gstatic.com",
      // Google Identity Services uses iframe for FedCM fallback
      "frame-src https://accounts.google.com",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_TIMESTAMP: new Date().toISOString(),
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },

  // Permanent redirects for legacy /trip/:id URLs → /trips/:id
  async redirects() {
    return [
      { source: "/trip/:id", destination: "/trips/:id", permanent: true },
      { source: "/trip/:id/edit", destination: "/trips/:id", permanent: true },
      {
        source: "/trip/:id/summary",
        destination: "/trips/:id/flights",
        permanent: true,
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
