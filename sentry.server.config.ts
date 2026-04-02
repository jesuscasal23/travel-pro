// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === "production";
const serverDsn = isProd
  ? process.env.SENTRY_DSN ?? "https://0d10b09d30309c5e6e00e4677045e8f4@o4509951322030080.ingest.de.sentry.io/4510906602946640"
  : undefined;

Sentry.init({
  dsn: serverDsn,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  beforeSend(event) {
    // Filter out client-disconnect noise: Node.js fires "Error: aborted" via
    // abortIncoming() when the client closes the connection mid-request.
    // This is expected behaviour, not an application error.
    if (event.exception?.values?.some((e) => e.value === "aborted")) {
      return null;
    }
    return event;
  },
  enabled: isProd && Boolean(serverDsn),
});
