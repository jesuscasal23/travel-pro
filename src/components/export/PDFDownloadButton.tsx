"use client";

// ============================================================
// Travel Pro — PDF Download Button
// Wraps @react-pdf/renderer's PDFDownloadLink in a styled button.
// Must be a Client Component (browser Download API).
//
// @react-pdf/renderer uses browser canvas APIs, so we lazy-import
// it inside useEffect to guarantee server-safe rendering.
// ============================================================

import { useState, useEffect, type ComponentType } from "react";
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
    Promise.all([
      import("@react-pdf/renderer"),
      import("@/lib/export/pdf-generator"),
    ])
      .then(([pdfRenderer, pdfGenerator]) => {
        // Use the setter function form to avoid calling the component as a function
        setPDFDownloadLink(
          () => pdfRenderer.PDFDownloadLink as unknown as ComponentType<PDFDownloadLinkProps>
        );
        setTripPDFDocument(
          () => pdfGenerator.TripPDFDocument
        );
      })
      .catch((err) => {
        console.error("[PDFDownloadButton] Failed to load PDF modules:", err);
      });
  }, []);

  // ── Loading / SSR state ──────────────────────────────────────
  if (!PDFDownloadLink || !TripPDFDocument) {
    return (
      <button
        disabled
        className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5 opacity-60 cursor-not-allowed"
        title="PDF is loading…"
      >
        <Download className="w-4 h-4" />
        Download PDF
      </button>
    );
  }

  // ── Ready state ──────────────────────────────────────────────
  return (
    <PDFDownloadLink
      document={<TripPDFDocument {...docProps} />}
      fileName={fileName}
    >
      {({ loading, error }) => (
        <button
          className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5"
          disabled={loading}
          title={error ? `PDF error: ${error.message}` : undefined}
        >
          <Download className="w-4 h-4" />
          {loading ? "Generating PDF…" : error ? "PDF Error" : "Download PDF"}
        </button>
      )}
    </PDFDownloadLink>
  );
}
