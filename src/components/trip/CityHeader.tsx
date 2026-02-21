"use client";

import Image from "next/image";
import { getCityHeroImage, CITY_IMAGE_BLUR } from "@/lib/utils/city-images";
import type { CityStop, CityWeather } from "@/types";

interface CityHeaderProps {
  city: CityStop;
  weather?: CityWeather;
  variant: "mobile" | "desktop";
}

export function CityHeader({ city, weather, variant }: CityHeaderProps) {
  const isMobile = variant === "mobile";

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl ${
      isMobile ? "h-32" : "h-[180px]"
    }`}>
      <Image
        src={getCityHeroImage(city.city)}
        alt={city.city}
        fill
        className="object-cover"
        sizes={isMobile ? "100vw" : "960px"}
        placeholder="blur"
        blurDataURL={CITY_IMAGE_BLUR}
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {/* Weather badge */}
      {weather && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-full px-2.5 py-1">
          <span className="text-sm">{weather.icon}</span>
          <span className="text-xs font-medium">{weather.temp}</span>
        </div>
      )}

      {/* City info */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-city-title text-white font-display font-bold">
          {city.city}
        </h3>
        <p className="text-white/80 text-sm">
          {city.country} · {city.days} days
        </p>
      </div>
    </div>
  );
}
