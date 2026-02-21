"use client";

import { Sparkles } from "lucide-react";
import { getCityHeroImage } from "@/lib/utils/city-images";
import type { CityStop } from "@/types";

interface MobileHeroProps {
  route: CityStop[];
  totalDays: number;
  countries: string[];
}

export function MobileHero({ route, totalDays, countries }: MobileHeroProps) {
  const heroCity = route[0]?.city ?? "travel";
  const heroImage = getCityHeroImage(heroCity);
  const cityCount = route.length;

  return (
    <div className="relative h-56 w-full overflow-hidden">
      {/* Background image with fallback */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={heroImage}
        alt=""
        loading="eager"
        fetchPriority="high"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 px-4">
        {/* Badge */}
        <div className="flex items-center gap-1.5 bg-primary/20 backdrop-blur-sm rounded-full px-3 py-1 mb-2">
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-medium text-primary">AI-crafted just for you</span>
        </div>

        {/* Title */}
        <h1 className="text-hero font-display font-extrabold text-foreground text-center">
          Your dream trip awaits ✈️
        </h1>

        {/* Subtitle */}
        <p className="text-xs text-muted-foreground mt-1 text-center">
          {totalDays} days · {countries.length} {countries.length === 1 ? "country" : "countries"} · {cityCount} {cityCount === 1 ? "city" : "cities"}
        </p>
      </div>
    </div>
  );
}
