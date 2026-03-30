"use client";

import { BottomNav } from "@/components/ui/BottomNav";
import { TripBanners } from "@/components/trip/TripBanners";
import { useTripContext } from "@/components/trip/TripContext";
import { useCityImage } from "@/hooks/useCityImage";
import { formatDateRange } from "@/lib/utils/format/date";
import { TripSectionNav } from "./TripSectionNav";

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
  const { itinerary, tripId, tripTitle, totalDays, dateStart, dateEnd } = useTripContext();
  const route = itinerary?.route ?? [];
  const days = itinerary?.days ?? [];
  const heroStop = route[0];
  const [src, onImgError] = useCityImage(heroStop?.city ?? tripTitle, heroStop?.countryCode);

  const firstDate = days[0]?.date ?? dateStart;
  const lastDate = days[days.length - 1]?.date ?? dateEnd;

  return (
    <div className="flex h-full flex-col bg-[image:var(--gradient-page-trip)]">
      <div className="flex-1 overflow-y-auto pb-28">
        <div className="px-6 pt-8 pb-4">
          <p className="text-brand-primary text-[11px] font-bold tracking-[0.24em] uppercase">
            Trip
          </p>
          <h1 className="text-ink mt-2 text-[2rem] leading-[0.95] font-bold tracking-[-0.05em]">
            {tripTitle}
          </h1>
          {firstDate && lastDate ? (
            <p className="text-dim mt-2 text-sm">
              {formatDateRange(firstDate, lastDate)} · {totalDays} days
            </p>
          ) : null}
        </div>

        {showHero ? (
          <div className="px-6">
            <div className="shadow-glass-xl relative overflow-hidden rounded-[30px] border border-white/80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-56 w-full object-cover" onError={onImgError} />
              <div className="absolute inset-0 bg-[image:var(--gradient-overlay-mobile)]" />
              <div className="bg-brand-primary absolute top-4 left-4 rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-white uppercase">
                Active Trip
              </div>
              <div className="absolute top-4 right-4 rounded-full border border-white/18 bg-white/12 px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-white uppercase backdrop-blur-md">
                {route.length} {route.length === 1 ? "Stop" : "Stops"}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-white/72 uppercase">
                  Fichi
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
    </div>
  );
}
