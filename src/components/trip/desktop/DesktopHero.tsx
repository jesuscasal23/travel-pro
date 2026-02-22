"use client";

import { useRef, useCallback, useState } from "react";
import Link from "next/link";
import { Pencil, LayoutList } from "lucide-react";
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
    [activeCityIndex, route.length, onCityClick],
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
        className="absolute inset-0 w-full h-full object-cover"
        onError={() => setHeroImage(getCityPlaceholder(heroCity))}
      />

      {/* Overlay with blur */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />

      {/* Radial gradient accents */}
      <div className="absolute inset-0 bg-radial-[at_25%_25%] from-primary/5 to-transparent" />

      {/* Content */}
      <div className="relative max-w-240 mx-auto px-4 py-10 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-primary/20 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
          <span className="text-xs font-medium text-primary">✨ AI-crafted just for you</span>
        </div>

        {/* Title */}
        <h1 className="text-hero font-display font-extrabold text-foreground">
          Your dream trip awaits ✈️
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground mt-2">
          {totalDays} days across <strong>{countries.join(", ")}</strong>
          {" "}&amp; more
        </p>

        {/* City cards scroll */}
        <div
          ref={cityScrollRef}
          role="tablist"
          aria-label="City selector"
          onKeyDown={handleCityKeyDown}
          className="flex gap-4 overflow-x-auto scrollbar-hide justify-center mt-6 pb-2"
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
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={isEditMode ? onEditRoute : onToggleEditMode}
              className={`text-sm py-2 px-4 flex items-center gap-1.5 ${
                isEditMode ? "btn-ghost" : "btn-ghost"
              }`}
            >
              <Pencil className="w-4 h-4" />
              {isEditMode ? "Edit Route" : "Edit trip"}
            </button>
            {!isEditMode && (
              <Link
                href={`/trip/${tripId}/summary`}
                className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5"
              >
                <LayoutList className="w-4 h-4" /> Summary & Share
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
