"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

function buildErrorReport(error: Error & { digest?: string }): string {
  const lines = [
    `Error: ${error.message}`,
    error.digest ? `Digest: ${error.digest}` : null,
    `URL: ${typeof window !== "undefined" ? window.location.href : "unknown"}`,
    `Time: ${new Date().toISOString()}`,
    `UA: ${typeof navigator !== "undefined" ? navigator.userAgent : "unknown"}`,
    error.stack ? `\nStack:\n${error.stack}` : null,
  ];
  return lines.filter(Boolean).join("\n");
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const report = buildErrorReport(error);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text for manual copy
      setShowDetails(true);
    }
  }, [report]);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 text-5xl">&#x26A0;&#xFE0F;</div>
        <h1 className="text-foreground mb-2 text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          An unexpected error occurred. Please try again or navigate to a different page.
        </p>

        {/* Error summary — always visible */}
        <div className="bg-surface-soft mb-6 rounded-xl p-4 text-left">
          <p className="text-foreground mb-1 text-xs font-semibold">Error</p>
          <p className="text-muted-foreground font-mono text-xs break-words">
            {error.message || "Unknown error"}
          </p>
          {error.digest && (
            <p className="text-muted-foreground mt-2 text-xs">
              <span className="font-semibold">ID:</span> {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button onClick={reset} className="btn-primary px-6 py-2.5 text-sm">
            Try again
          </button>
          <Link href="/trips" className="btn-ghost px-6 py-2.5 text-sm">
            Go to trips
          </Link>
        </div>

        {/* Copy / details toggle */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground text-xs underline transition-colors"
          >
            {copied ? "Copied!" : "Copy error details"}
          </button>
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="text-muted-foreground hover:text-foreground text-xs underline transition-colors"
          >
            {showDetails ? "Hide details" : "Show details"}
          </button>
        </div>

        {showDetails && (
          <pre className="bg-surface-soft text-muted-foreground mt-4 max-h-48 overflow-auto rounded-xl p-4 text-left font-mono text-[10px] select-all">
            {report}
          </pre>
        )}
      </div>
    </div>
  );
}
