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
  const route = itinerary?.route ?? [];

  if (route.length === 0) {
    return (
      <TripMobileShell>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="font-display text-foreground text-lg font-bold">No route yet</p>
          <p className="text-muted-foreground mt-1 max-w-xs text-sm">
            Generate your itinerary to see your route on the map.
          </p>
        </div>
      </TripMobileShell>
    );
  }

  return (
    <TripMobileShell>
      <div className="shadow-glass-xl rounded-[28px] border border-white/80 bg-white/88 p-3">
        <div className="h-[420px] overflow-hidden rounded-[24px]">
          <RouteMap cities={route} activeCityIndex={null} onCityClick={() => {}} />
        </div>
      </div>
    </TripMobileShell>
  );
}
