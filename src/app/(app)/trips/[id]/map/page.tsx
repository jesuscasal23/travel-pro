"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { TripMobileShell } from "@/components/trip/mobile/TripMobileShell";
import { useTripContext } from "@/components/trip/TripContext";
import { useHotelSelections } from "@/hooks/api/selections/useHotelSelections";
import type { HotelPin } from "@/components/map/RouteMap";

const RouteMap = dynamic(() => import("@/components/map/RouteMap"), {
  ssr: false,
  loading: () => <div className="h-[420px] animate-pulse rounded-[28px] bg-white/70" />,
});

export default function TripMapPage() {
  const { itinerary, tripId } = useTripContext();
  const route = itinerary?.route ?? [];
  const { data: hotelSelections } = useHotelSelections(tripId);
  const [activeCityIndex, setActiveCityIndex] = useState<number | null>(null);

  // Derive hotel pins from selected hotels matched against accommodationData
  const hotelPins = useMemo<HotelPin[]>(() => {
    if (!hotelSelections?.length || !itinerary?.accommodationData?.length) return [];

    const pins: HotelPin[] = [];
    for (const selection of hotelSelections) {
      const cityAccom = itinerary.accommodationData.find(
        (a) => a.city === selection.city && a.checkIn === selection.checkIn
      );
      if (!cityAccom) continue;

      const hotel = cityAccom.hotels.find((h) => h.hotelId === selection.hotelId);
      if (!hotel?.lat || !hotel?.lng) continue;

      pins.push({
        lat: hotel.lat,
        lng: hotel.lng,
        name: hotel.name,
        pricePerNight: hotel.pricePerNight ?? null,
        rating: hotel.rating ?? null,
        city: hotel.city,
      });
    }
    return pins;
  }, [hotelSelections, itinerary]);

  // Filter cities by day selection
  const filteredRoute = activeCityIndex !== null ? [route[activeCityIndex]].filter(Boolean) : route;

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

  // Filter hotel pins by active city
  const filteredHotelPins =
    activeCityIndex !== null
      ? hotelPins.filter((h) => h.city === route[activeCityIndex]?.city)
      : hotelPins;

  return (
    <TripMobileShell>
      {/* Day filter pills */}
      {route.length > 1 && (
        <div className="scrollbar-none mb-3 flex gap-2 overflow-x-auto px-1">
          <button
            onClick={() => setActiveCityIndex(null)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              activeCityIndex === null
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-surface-soft text-muted-foreground hover:bg-surface-hover"
            }`}
          >
            All
          </button>
          {route.map((city, i) => (
            <button
              key={city.id}
              onClick={() => setActiveCityIndex(activeCityIndex === i ? null : i)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                activeCityIndex === i
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-surface-soft text-muted-foreground hover:bg-surface-hover"
              }`}
            >
              {city.city}
            </button>
          ))}
        </div>
      )}

      <div className="shadow-glass-xl rounded-[28px] border border-white/80 bg-white/88 p-3">
        <div className="h-[420px] overflow-hidden rounded-[24px]">
          <RouteMap
            cities={filteredRoute}
            activeCityIndex={null}
            onCityClick={(i) => {
              if (activeCityIndex === null) setActiveCityIndex(i);
            }}
            hotelPins={filteredHotelPins}
          />
        </div>
      </div>
    </TripMobileShell>
  );
}
