import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: [
    // Scripts (not auto-detected by Next.js plugin)
    "scripts/**/*.{ts,js}",
    // E2E tests
    "e2e/**/*.spec.ts",
    // Sentry side-effect configs
    "sentry.*.config.ts",
    // Sitemap config
    "next-sitemap.config.js",
  ],
  ignore: [
    // Email templates are rendered server-side by reference string — knip can't trace them
    "src/lib/email/**",
    // Map fallback rendered conditionally by react-map-gl internals
    "src/components/map/RouteMapFallback.tsx",
    // CollapsibleSection rendered inside trip plan-view tabs in a way knip misses
    "src/components/ui/CollapsibleSection.tsx",
  ],
  ignoreDependencies: [
    // Server-side deps knip can't trace through Next.js API routes at build time
    "resend",
    "react-email",
    "@react-email/components",
    "@react-email/render",
    // pg used via Prisma adapter at runtime, not imported in app code directly
    "pg",
    "@types/pg",
    // Upstash rate-limiting used in proxy.ts via dynamic pattern
    "@upstash/ratelimit",
    // PostCSS used implicitly by Next.js/Tailwind build pipeline (no direct import)
    "postcss",
    // dotenv used in prisma.config.ts and scripts — not traced by Next.js plugin
    "dotenv",
    // ESLint plugins imported in eslint.config.mjs — not in src/
    "typescript-eslint",
    "eslint-plugin-import",
  ],
  ignoreBinaries: [
    // CLI tools invoked in npm scripts but not installed as direct deps
    "tsx",
    "ts-node",
  ],
};

export default config;
