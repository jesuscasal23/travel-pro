"use client";

import { useState } from "react";
import Image from "next/image";
import { getCityHeroImage, getCityPlaceholder, CITY_IMAGE_BLUR } from "@/lib/utils/city-images";
import type { CityStop, CityWeather } from "@/types";

interface CityHeaderProps {
  city: CityStop;
  weather?: CityWeather;
  variant: "mobile" | "desktop";
}

export function CityHeader({ city, weather, variant }: CityHeaderProps) {
  const isMobile = variant === "mobile";
  const [src, setSrc] = useState(() => getCityHeroImage(city.city, city.countryCode));

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[28px] border border-white/70 shadow-[0_20px_40px_rgba(27,43,75,0.08)] ${isMobile ? "h-32" : "h-[180px]"}`}
    >
      <Image
        src={src}
        alt={city.city}
        fill
        className="object-cover"
        sizes={isMobile ? "100vw" : "960px"}
        placeholder="blur"
        blurDataURL={CITY_IMAGE_BLUR}
        unoptimized
        onError={() => setSrc(getCityPlaceholder(city.city))}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,19,39,0.12)_0%,rgba(9,19,39,0.22)_32%,rgba(9,19,39,0.78)_100%)]" />

      {/* Weather badge */}
      {weather && (
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full border border-white/20 bg-white/14 px-2.5 py-1 text-white backdrop-blur-md">
          <span className="text-sm">{weather.icon}</span>
          <span className="text-xs font-medium">{weather.temp}</span>
        </div>
      )}

      {/* City info */}
      <div className="absolute right-0 bottom-0 left-0 p-4">
        <h3 className="text-city-title font-display font-bold text-white">{city.city}</h3>
        <p className="text-sm text-white/80">
          {city.country} · {city.days} days
        </p>
      </div>
    </div>
  );
}
