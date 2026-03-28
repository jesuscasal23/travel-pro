"use client";

import type { ReactNode } from "react";
import { Calendar, ChevronRight } from "lucide-react";
import { useCityImage } from "@/hooks/useCityImage";
import { formatDateRange } from "@/lib/utils/format/date";
import type { TripSummary } from "@/types";

interface TripCardProps {
  trip: TripSummary;
  label: string;
  days: number | null;
  onClick: () => void;
  actions?: ReactNode;
}

export function TripCard({ trip, label, days, onClick, actions }: TripCardProps) {
  const cityName = trip.destination || label;
  const countryCode = trip.destinationCountryCode ?? "";
  const [src, onImgError] = useCityImage(cityName, countryCode || undefined);

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      onClick={onClick}
    >
      <div className="relative aspect-[4/5]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={label}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={onImgError}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Countdown Badge */}
        {days !== null && (
          <div className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1.5 shadow-lg backdrop-blur-md">
            <span className="text-brand-primary text-[10px] font-bold tracking-tighter uppercase">
              {days === 0 ? "Today!" : `${days} days away`}
            </span>
          </div>
        )}

        {/* Action Menu */}
        {actions && <div className="absolute top-4 right-4 z-10">{actions}</div>}

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 w-full p-6">
          <div className="mb-2 flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-white/70" />
            <span className="text-xs font-medium text-white/80">
              {formatDateRange(trip.dateStart, trip.dateEnd)}
            </span>
          </div>

          <h3 className="font-display mb-4 text-2xl font-bold text-white">{label}</h3>

          <div className="flex items-center justify-between">
            {/* Traveler Avatars */}
            <div className="flex -space-x-2">
              {Array.from({ length: Math.min(trip.travelers, 3) }).map((_, i) => (
                <div
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-300 dark:bg-slate-600"
                >
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {String.fromCharCode(65 + i)}
                  </span>
                </div>
              ))}
              {trip.travelers > 3 && (
                <div className="bg-brand-primary flex h-8 w-8 items-center justify-center rounded-full border-2 border-white">
                  <span className="text-[10px] font-bold text-white">+{trip.travelers - 3}</span>
                </div>
              )}
            </div>

            {/* Arrow Button */}
            <button className="bg-brand-primary rounded-full p-2 text-white shadow-lg transition-colors hover:opacity-90">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
