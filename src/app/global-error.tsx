"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          backgroundColor: "#fafafa",
          color: "#1a1a1a",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center", padding: "0 16px" }}>
          <div style={{ fontSize: 48, marginBottom: 24 }}>&#x26A0;&#xFE0F;</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#666",
              marginBottom: 32,
              lineHeight: 1.5,
            }}
          >
            A critical error occurred. Please reload the page.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: "#0D7377",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Reload page
          </button>
        </div>
      </body>
    </html>
  );
}
