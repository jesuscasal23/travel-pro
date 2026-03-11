"use client";

import dynamic from "next/dynamic";
import { TripMobileShell } from "@/components/trip/mobile/TripMobileShell";
import { useTripContext } from "@/components/trip/TripContext";

const RouteMap = dynamic(() => import("@/components/map/RouteMap"), {
  ssr: false,
  loading: () => <div className="h-[420px] animate-pulse rounded-[28px] bg-white/70" />,
});

export default function TripMapPage() {
  const { itinerary } = useTripContext();

  return (
    <TripMobileShell>
      <div className="rounded-[28px] border border-white/80 bg-white/88 p-3 shadow-[0_20px_40px_rgba(27,43,75,0.06)]">
        <div className="h-[420px] overflow-hidden rounded-[24px]">
          <RouteMap cities={itinerary.route} activeCityIndex={null} onCityClick={() => {}} />
        </div>
      </div>
    </TripMobileShell>
  );
}
