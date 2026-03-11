"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Share2 } from "lucide-react";
import { BottomNav } from "@/components/v2/ui/BottomNav";
import { ShareModal } from "@/components/trip/ShareModal";
import { TripBanners } from "@/components/trip/TripBanners";
import { useTripShare } from "@/components/trip/hooks/useTripShare";
import { useTripContext } from "@/components/trip/TripContext";
import { getCityHeroImage, getCityPlaceholder } from "@/lib/utils/city-images";
import { TripSectionNav } from "./TripSectionNav";

function formatDateRange(start?: string, end?: string): string {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", opts)}`;
}

interface TripMobileShellProps {
  children: React.ReactNode;
  showHero?: boolean;
  showBanners?: boolean;
}

export function TripMobileShell({
  children,
  showHero = false,
  showBanners = false,
}: TripMobileShellProps) {
  const { itinerary, tripId, tripTitle, isAuthenticated, totalDays } = useTripContext();
  const [src, setSrc] = useState(() => {
    const heroStop = itinerary.route[0];
    return heroStop
      ? getCityHeroImage(heroStop.city, heroStop.countryCode)
      : getCityPlaceholder(tripTitle);
  });
  const { shareModalOpen, setShareModalOpen, shareUrl, handleShareClick, isSharePending } =
    useTripShare(tripId, isAuthenticated);

  const firstDate = itinerary.days[0]?.date;
  const lastDate = itinerary.days[itinerary.days.length - 1]?.date;

  return (
    <div className="flex min-h-dvh flex-col bg-[linear-gradient(180deg,#f9fbff_0%,#ffffff_22%,#f4f7fb_100%)]">
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="flex items-start justify-between px-6 pt-8 pb-4">
          <div>
            <Link
              href="/trips"
              className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/88 text-[#6d7b91] shadow-[0_14px_24px_rgba(27,43,75,0.05)]"
              aria-label="Back to trips"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <p className="text-brand-primary text-[11px] font-bold tracking-[0.24em] uppercase">
              Trip
            </p>
            <h1 className="mt-2 text-[2rem] leading-[0.95] font-bold tracking-[-0.05em] text-[#101114]">
              {tripTitle}
            </h1>
            {firstDate && lastDate ? (
              <p className="mt-2 text-sm text-[#6d7b91]">
                {formatDateRange(firstDate, lastDate)} · {totalDays} days
              </p>
            ) : null}
          </div>

          <button
            onClick={handleShareClick}
            className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/88 text-[#243247] shadow-[0_14px_24px_rgba(27,43,75,0.05)]"
            aria-label="Share trip"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        {showHero ? (
          <div className="px-6">
            <div className="relative overflow-hidden rounded-[30px] border border-white/80 shadow-[0_24px_48px_rgba(27,43,75,0.08)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="h-56 w-full object-cover"
                onError={() => setSrc(getCityPlaceholder(tripTitle))}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,19,39,0.16)_0%,rgba(9,19,39,0.74)_100%)]" />
              <div className="bg-brand-primary absolute top-4 left-4 rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-white uppercase">
                Active Trip
              </div>
              <div className="absolute top-4 right-4 rounded-full border border-white/18 bg-white/12 px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-white uppercase backdrop-blur-md">
                {itinerary.route.length} {itinerary.route.length === 1 ? "Stop" : "Stops"}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-white/72 uppercase">
                  Travel Pro
                </p>
                <h2 className="mt-2 text-[2rem] leading-[0.95] font-bold tracking-[-0.05em]">
                  {tripTitle}
                </h2>
                <p className="mt-2 text-sm text-white/80">
                  {formatDateRange(firstDate, lastDate)} · {totalDays} days
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <TripSectionNav tripId={tripId} />

        {showBanners ? <TripBanners variant="mobile" /> : null}

        <div className="px-6 pb-4">{children}</div>
      </div>

      <BottomNav />

      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        shareUrl={shareUrl}
        isLoading={isSharePending}
        tripTitle={tripTitle}
      />
    </div>
  );
}
