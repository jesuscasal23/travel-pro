"use client";

import { useCityImage } from "@/hooks/useCityImage";
import { formatDateRange } from "@/lib/utils/format/date";
import type { TripSummary } from "@/types";

interface TripCardProps {
  trip: TripSummary;
  label: string;
  days: number | null;
  onClick: () => void;
}

export function TripCard({ trip, label, days, onClick }: TripCardProps) {
  const cityName = trip.destination || label;
  const countryCode = trip.destinationCountryCode ?? "";
  const [src, onImgError] = useCityImage(cityName, countryCode || undefined);

  return (
    <div className="relative h-52 cursor-pointer overflow-hidden rounded-2xl" onClick={onClick}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label}
        className="absolute inset-0 h-full w-full object-cover"
        onError={onImgError}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

      <div className="absolute top-3 right-3">
        <span className="bg-navy/80 rounded-full px-2.5 py-1 text-[10px] font-bold text-white uppercase backdrop-blur-sm">
          {days ? `${days} DAYS AWAY` : "PLANNED"}
        </span>
      </div>
      <p className="absolute bottom-12 left-5 text-xl font-bold text-white">{label}</p>
      <div className="absolute bottom-4 left-5 flex items-center gap-2">
        <span className="rounded-full bg-black/40 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
          {formatDateRange(trip.dateStart, trip.dateEnd)}
        </span>
        <span className="text-xs text-white/60">&bull;</span>
        <span className="text-xs text-white/80">
          {trip.travelers} traveler{trip.travelers !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
