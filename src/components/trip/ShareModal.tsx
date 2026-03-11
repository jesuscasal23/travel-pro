"use client";

import { useState } from "react";
import { Copy, Check, Mail, Share2, Link2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button, Skeleton } from "@/components/ui";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string | null;
  isLoading: boolean;
  tripTitle: string;
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function ShareModal({
  open,
  onOpenChange,
  shareUrl,
  isLoading,
  tripTitle,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function" && !!shareUrl;

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: select the text manually
    }
  }

  async function handleNativeShare() {
    if (!shareUrl || !canNativeShare) return;
    try {
      await navigator.share({
        title: tripTitle,
        text: `Check out my trip: ${tripTitle}`,
        url: shareUrl,
      });
    } catch {
      // User cancelled or share target failed; ignore.
    }
  }

  function handleWhatsApp() {
    if (!shareUrl) return;
    const text = encodeURIComponent(`Check out my trip: ${tripTitle} 🗺️ ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  function handleEmail() {
    if (!shareUrl) return;
    const subject = encodeURIComponent(`My ${tripTitle} trip plan`);
    const body = encodeURIComponent(
      `I planned a trip with Travel Pro! Check it out:\n\n${shareUrl}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Share your trip"
      mobileSheet
      maxWidth="sm:max-w-lg"
      contentClassName="px-5 pt-3 pb-5"
    >
      <div className="space-y-5">
        <div className="mx-auto mb-1 h-1.5 w-12 rounded-full bg-[#d9e4f5] sm:hidden" />

        <div className="rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,#f8fbff_0%,#f2f6fc_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
          <p className="text-brand-primary text-[11px] font-bold tracking-[0.2em] uppercase">
            Share link
          </p>
          <p className="mt-2 text-[15px] font-semibold tracking-[-0.02em] text-[#17181c]">
            {tripTitle}
          </p>
          <p className="mt-1 text-sm leading-6 text-[#6d7b91]">
            Send your itinerary to a friend or save the link for later.
          </p>
        </div>

        {/* URL display */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold tracking-[0.18em] text-[#8ea0bb] uppercase">Link</p>
          {isLoading || !shareUrl ? (
            <Skeleton className="h-14 w-full rounded-[22px]" />
          ) : (
            <div className="flex items-center gap-3 rounded-[22px] border border-white/80 bg-white/90 px-4 py-3 shadow-[0_16px_30px_rgba(27,43,75,0.05)]">
              <div className="text-brand-primary bg-brand-primary-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
                <Link2 className="h-4 w-4" />
              </div>
              <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-[#6d7b91]">
                {shareUrl}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {canNativeShare ? (
            <Button
              variant="primary"
              className="!bg-brand-primary w-full gap-2 rounded-[22px] py-3.5 text-sm font-semibold shadow-[var(--shadow-brand-lg)]"
              onClick={() => {
                void handleNativeShare();
              }}
              disabled={isLoading || !shareUrl}
            >
              <Share2 className="h-4 w-4" />
              Share now
            </Button>
          ) : null}

          <Button
            variant={canNativeShare ? "ghost" : "primary"}
            className={`w-full gap-2 rounded-[22px] py-3.5 text-sm font-semibold ${
              canNativeShare
                ? "border border-white/80 bg-white/88 text-[#243247] shadow-[0_16px_30px_rgba(27,43,75,0.05)]"
                : "!bg-brand-primary shadow-[var(--shadow-brand-lg)]"
            }`}
            onClick={handleCopy}
            disabled={isLoading || !shareUrl}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy link"}
          </Button>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-[#dde6f2]" />
          <span className="text-[11px] font-bold tracking-[0.18em] text-[#8ea0bb] uppercase">
            More ways
          </span>
          <div className="h-px flex-1 bg-[#dde6f2]" />
        </div>

        {/* Social share buttons */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            variant="ghost"
            className="gap-2 rounded-[22px] border border-white/80 bg-white/88 py-3.5 text-sm font-semibold text-[#243247] shadow-[0_16px_30px_rgba(27,43,75,0.05)]"
            onClick={handleWhatsApp}
            disabled={isLoading || !shareUrl}
          >
            <WhatsAppIcon />
            WhatsApp
          </Button>
          <Button
            variant="ghost"
            className="gap-2 rounded-[22px] border border-white/80 bg-white/88 py-3.5 text-sm font-semibold text-[#243247] shadow-[0_16px_30px_rgba(27,43,75,0.05)]"
            onClick={handleEmail}
            disabled={isLoading || !shareUrl}
          >
            <Mail className="h-4 w-4" />
            Email
          </Button>
        </div>
      </div>
    </Modal>
  );
}
