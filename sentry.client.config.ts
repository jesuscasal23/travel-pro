// ============================================================
// Travel Pro — Sentry Client Configuration
// ============================================================
import * as Sentry from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === "production";
const clientDsn = isProd ? process.env.NEXT_PUBLIC_SENTRY_DSN : undefined;

Sentry.init({
  dsn: clientDsn,
  environment: process.env.NODE_ENV,

  // Trace a percentage of requests for performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Replay sessions for debugging (production only, 1% of sessions)
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Don't report errors or initialize transports in development
  enabled: isProd && Boolean(clientDsn),
});
