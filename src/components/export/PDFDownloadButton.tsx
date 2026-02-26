"use client";

// ============================================================
// Travel Pro — PDF Download Button
// Wraps @react-pdf/renderer's PDFDownloadLink in a styled button.
// Must be a Client Component (browser Download API).
//
// @react-pdf/renderer uses browser canvas APIs, so we lazy-import
// it inside useEffect to guarantee server-safe rendering.
// ============================================================

import { useState, useEffect, useMemo, type ComponentType } from "react";
import { Download } from "lucide-react";
import type { TripPDFDocumentProps } from "@/lib/export/pdf-generator";

// ============================================================
// Types (kept minimal to avoid importing @react-pdf/renderer at module level)
// ============================================================

type RenderChildren = (opts: { loading: boolean; error: Error | null }) => React.ReactNode;

interface PDFDownloadLinkProps {
  document: React.ReactElement;
  fileName: string;
  children: RenderChildren;
}

// ============================================================
// Component
// ============================================================

interface PDFDownloadButtonProps extends TripPDFDocumentProps {
  fileName?: string;
}

export function PDFDownloadButton({
  fileName = "TravelPro-Japan-Vietnam-Thailand.pdf",
  ...docProps
}: PDFDownloadButtonProps) {
  const [PDFDownloadLink, setPDFDownloadLink] =
    useState<ComponentType<PDFDownloadLinkProps> | null>(null);
  const [TripPDFDocument, setTripPDFDocument] =
    useState<ComponentType<TripPDFDocumentProps> | null>(null);

  useEffect(() => {
    // Load both modules on the client only — never on the server
    Promise.all([import("@react-pdf/renderer"), import("@/lib/export/pdf-generator")])
      .then(([pdfRenderer, pdfGenerator]) => {
        // Use the setter function form to avoid calling the component as a function
        setPDFDownloadLink(
          () => pdfRenderer.PDFDownloadLink as unknown as ComponentType<PDFDownloadLinkProps>
        );
        setTripPDFDocument(() => pdfGenerator.TripPDFDocument);
      })
      .catch((err) => {
        console.error("[PDFDownloadButton] Failed to load PDF modules:", err);
      });
  }, []);

  // ── Stable document element ───────────────────────────────────
  // Must be memoized: a new JSX element on every render causes PDFDownloadLink's
  // internal useEffect (which depends on the document prop) to fire on every render,
  // triggering an infinite PDF re-generation loop that never resolves.

  const docElement = useMemo(
    () => (TripPDFDocument ? <TripPDFDocument {...docProps} /> : null),
    [
      TripPDFDocument,
      // Spread docProps keys explicitly so the memo only re-runs when data actually changes
      docProps.days,
      docProps.route,
      docProps.visas,
      docProps.weather,
      docProps.tripTitle,
      docProps.tripSubtitle,
    ]
  );

  // ── Loading / SSR state ──────────────────────────────────────
  if (!PDFDownloadLink || !TripPDFDocument || !docElement) {
    return (
      <button
        disabled
        className="btn-primary flex cursor-not-allowed items-center gap-1.5 px-4 py-2 text-sm opacity-60"
        title="PDF is loading…"
      >
        <Download className="h-4 w-4" />
        Download PDF
      </button>
    );
  }

  // ── Ready state ──────────────────────────────────────────────
  return (
    <PDFDownloadLink document={docElement} fileName={fileName}>
      {({ loading, error }) => {
        if (error) console.error("[PDFDownloadButton] render error:", error);
        return (
          <button
            className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm"
            disabled={loading}
            title={error ? `PDF error: ${error.message}` : undefined}
          >
            <Download className="h-4 w-4" />
            {loading ? "Generating PDF…" : error ? "PDF Error" : "Download PDF"}
          </button>
        );
      }}
    </PDFDownloadLink>
  );
}
