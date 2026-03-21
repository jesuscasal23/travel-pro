"use client";

import { useRouter } from "next/navigation";
import { CalendarDays, BedDouble, Map, Wallet } from "lucide-react";
import { useCityImage } from "@/hooks/useCityImage";
import { formatDateRange } from "@/lib/utils/format/date";
import type { TripSummary } from "@/types";

interface ActiveTripCardProps {
  trip: TripSummary;
  onClick: () => void;
}

export function ActiveTripCard({ trip, onClick }: ActiveTripCardProps) {
  const router = useRouter();
  const cityName = trip.destination ?? trip.region;
  const countryCode = trip.destinationCountryCode ?? "";
  const [src, onImgError] = useCityImage(cityName, countryCode || undefined);
  const stops = trip.itineraries?.length ?? 1;
  const tripId = trip.id;

  return (
    <div
      role="button"
      tabIndex={0}
      className="relative cursor-pointer overflow-hidden rounded-[24px] shadow-[0_20px_40px_rgba(27,43,75,0.12)]"
      onClick={onClick}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={cityName} className="h-52 w-full object-cover" onError={onImgError} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Badges */}
      <div className="absolute top-3 left-3 flex gap-2">
        <span className="rounded-full bg-[#3b82f6] px-2.5 py-1 text-[10px] font-bold text-white uppercase">
          Active Trip
        </span>
      </div>
      <div className="absolute top-3 right-3">
        <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
          <CalendarDays className="h-3 w-3" />
          {formatDateRange(trip.dateStart, trip.dateEnd)}
        </span>
      </div>

      {/* Title */}
      <div className="absolute bottom-14 left-4">
        <p className="text-[10px] font-bold tracking-[0.14em] text-white/70 uppercase">
          Travel Pro
        </p>
        <h2 className="text-xl font-bold text-white">{cityName}</h2>
        <p className="text-xs text-white/80">
          {trip.destinationCountry} · {stops} stop{stops !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Quick action bar */}
      <div className="absolute right-0 bottom-0 left-0 flex items-center justify-around bg-black/30 py-2.5 backdrop-blur-sm">
        {[
          { icon: CalendarDays, label: "Itinerary", href: `/trips/${tripId}/itinerary` },
          { icon: BedDouble, label: "Hotels", href: `/trips/${tripId}/hotels` },
          { icon: Wallet, label: "Budget", href: `/trips/${tripId}/budget` },
          { icon: Map, label: "Map", href: `/trips/${tripId}/map` },
        ].map((action) => (
          <button
            key={action.label}
            onClick={(e) => {
              e.stopPropagation();
              router.push(action.href);
            }}
            className="flex flex-col items-center gap-1"
          >
            <action.icon className="h-4 w-4 text-white" />
            <span className="text-[9px] font-semibold tracking-[0.06em] text-white/80 uppercase">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
