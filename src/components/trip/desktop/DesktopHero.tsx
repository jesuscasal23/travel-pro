"use client";

import { useRef, useCallback, useState } from "react";
import Link from "next/link";
import { Pencil, LayoutList, Share2 } from "lucide-react";
import { CityCard } from "../CityCard";
import { getCityHeroImage, getCityPlaceholder } from "@/lib/utils/city-images";
import type { CityStop } from "@/types";

interface DesktopHeroProps {
  route: CityStop[];
  totalDays: number;
  countries: string[];
  tripId: string;
  isPartialItinerary: boolean;
  activeCityIndex: number | null;
  onCityClick: (index: number) => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onEditRoute: () => void;
  onShare: () => void;
}

export function DesktopHero({
  route,
  totalDays,
  countries,
  tripId,
  isPartialItinerary,
  activeCityIndex,
  onCityClick,
  isEditMode,
  onToggleEditMode,
  onEditRoute,
  onShare,
}: DesktopHeroProps) {
  const heroStop = route[0];
  const heroCity = heroStop?.city ?? "travel";
  const initialSrc = heroStop
    ? getCityHeroImage(heroStop.city, heroStop.countryCode)
    : getCityPlaceholder(heroCity);
  const [heroImage, setHeroImage] = useState(initialSrc);
  const cityScrollRef = useRef<HTMLDivElement>(null);

  const handleCityKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const current = activeCityIndex ?? 0;
      let next = current;
      if (e.key === "ArrowRight") next = Math.min(current + 1, route.length - 1);
      else if (e.key === "ArrowLeft") next = Math.max(current - 1, 0);
      else return;

      e.preventDefault();
      onCityClick(next);
      const buttons = cityScrollRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]");
      buttons?.[next]?.focus();
    },
    [activeCityIndex, route.length, onCityClick]
  );

  return (
    <div className="relative w-full overflow-hidden">
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={heroImage}
        alt=""
        loading="eager"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => setHeroImage(getCityPlaceholder(heroCity))}
      />

      {/* Overlay with blur */}
      <div className="bg-background/70 absolute inset-0 backdrop-blur-[2px]" />

      {/* Radial gradient accents */}
      <div className="from-primary/5 absolute inset-0 bg-radial-[at_25%_25%] to-transparent" />

      {/* Content */}
      <div className="relative mx-auto max-w-240 px-4 py-10 text-center">
        {/* Badge */}
        <div className="bg-primary/20 mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 backdrop-blur-sm">
          <span className="text-primary text-xs font-medium">✨ AI-crafted just for you</span>
        </div>

        {/* Title */}
        <h1 className="text-hero font-display text-foreground font-extrabold">
          Your dream trip awaits ✈️
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground mt-2 text-sm">
          {totalDays} days across <strong>{countries.join(", ")}</strong> &amp; more
        </p>

        {/* City cards scroll */}
        <div
          ref={cityScrollRef}
          role="tablist"
          aria-label="City selector"
          onKeyDown={handleCityKeyDown}
          className="scrollbar-hide mt-6 flex justify-center gap-4 overflow-x-auto pb-2"
        >
          {route.map((city, i) => (
            <CityCard
              key={city.id}
              city={city}
              isActive={activeCityIndex === i}
              onClick={() => onCityClick(i)}
              variant="desktop"
            />
          ))}
        </div>

        {/* Action buttons */}
        {!isPartialItinerary && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={isEditMode ? onEditRoute : onToggleEditMode}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm ${
                isEditMode ? "btn-ghost" : "btn-ghost"
              }`}
            >
              <Pencil className="h-4 w-4" />
              {isEditMode ? "Edit Route" : "Edit trip"}
            </button>
            {!isEditMode && (
              <>
                <button
                  onClick={onShare}
                  className="btn-ghost flex items-center gap-1.5 px-4 py-2 text-sm"
                >
                  <Share2 className="h-4 w-4" /> Share
                </button>
                <Link
                  href={`/trip/${tripId}/summary`}
                  className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm"
                >
                  <LayoutList className="h-4 w-4" /> Summary
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
