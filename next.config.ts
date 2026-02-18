import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent the page from being embedded in an iframe (clickjacking protection)
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limit referrer information sent to third-party sites
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features not used by this app
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js App Router requires unsafe-inline for its runtime scripts.
      // unsafe-eval is needed by Next.js in development; consider removing in production builds.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Tailwind v4 and Next.js inject inline styles
      "style-src 'self' 'unsafe-inline'",
      // Mapbox tiles and local assets
      "img-src 'self' data: blob: https://*.mapbox.com https://*.maplibre.org",
      // External API connections: Mapbox, Supabase, Open-Meteo weather
      "connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://*.supabase.co https://api.open-meteo.com",
      // Mapbox GL uses Web Workers via blob: URLs
      "worker-src blob:",
      "font-src 'self'",
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
};

export default nextConfig;