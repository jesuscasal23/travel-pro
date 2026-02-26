"use client";

import { useState } from "react";
import { Pencil, Sparkles, Share2 } from "lucide-react";
import { getCityHeroImage, getCityPlaceholder } from "@/lib/utils/city-images";
import type { CityStop } from "@/types";

interface MobileHeroProps {
  route: CityStop[];
  totalDays: number;
  countries: string[];
  isEditMode: boolean;
  onToggleEditMode: () => void;
  isPartialItinerary: boolean;
  onShare: () => void;
}

export function MobileHero({
  route,
  totalDays,
  countries,
  isEditMode,
  onToggleEditMode,
  isPartialItinerary,
  onShare,
}: MobileHeroProps) {
  const heroStop = route[0];
  const heroCity = heroStop?.city ?? "travel";
  const initialSrc = heroStop
    ? getCityHeroImage(heroStop.city, heroStop.countryCode)
    : getCityPlaceholder(heroCity);
  const [src, setSrc] = useState(initialSrc);
  const cityCount = route.length;

  return (
    <div className="relative h-56 w-full overflow-hidden">
      {/* Background image with fallback */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="eager"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => setSrc(getCityPlaceholder(heroCity))}
      />

      {/* Gradient overlay */}
      <div className="from-background via-background/30 absolute inset-0 bg-linear-to-t to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-end px-4 pb-6">
        {/* Badge */}
        <div className="bg-primary/20 mb-2 flex items-center gap-1.5 rounded-full px-3 py-1 backdrop-blur-sm">
          <Sparkles className="text-primary h-3 w-3" />
          <span className="text-primary text-[10px] font-medium">AI-crafted just for you</span>
        </div>

        {/* Title */}
        <h1 className="text-hero font-display text-foreground text-center font-extrabold">
          Your dream trip awaits ✈️
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground mt-1 text-center text-xs">
          {totalDays} days · {countries.length} {countries.length === 1 ? "country" : "countries"} ·{" "}
          {cityCount} {cityCount === 1 ? "city" : "cities"}
        </p>
      </div>

      {/* Top-right action buttons */}
      {!isPartialItinerary && (
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {!isEditMode && (
            <button
              onClick={onShare}
              className="bg-background/80 text-foreground hover:bg-background flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors"
              aria-label="Share trip"
            >
              <Share2 className="h-3 w-3" />
              Share
            </button>
          )}
          <button
            onClick={onToggleEditMode}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors ${
              isEditMode
                ? "bg-primary text-white"
                : "bg-background/80 text-foreground hover:bg-background"
            }`}
            aria-label={isEditMode ? "Exit edit mode" : "Enter edit mode"}
          >
            <Pencil className="h-3 w-3" />
            {isEditMode ? "Editing" : "Edit"}
          </button>
        </div>
      )}
    </div>
  );
}
