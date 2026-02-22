"use client";

import { useState } from "react";
import Image from "next/image";
import { getCityImage, getCityPlaceholder, CITY_IMAGE_BLUR } from "@/lib/utils/city-images";
import type { CityStop } from "@/types";

interface CityCardProps {
  city: CityStop;
  isActive: boolean;
  onClick: () => void;
  variant: "mobile" | "desktop";
}

export function CityCard({ city, isActive, onClick, variant }: CityCardProps) {
  const isMobile = variant === "mobile";
  const [src, setSrc] = useState(() => getCityImage(city.city, city.countryCode));

  return (
    <button
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={onClick}
      className={`relative flex-shrink-0 overflow-hidden group ${
        isMobile ? "w-24 h-32 rounded-2xl" : "min-w-[160px] h-[200px] rounded-2xl"
      } ${
        isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
      } ${
        !isMobile ? "transition-transform duration-200 hover:scale-105" : ""
      }`}
    >
      <Image
        src={src}
        alt={city.city}
        fill
        className="object-cover"
        sizes={isMobile ? "96px" : "160px"}
        placeholder="blur"
        blurDataURL={CITY_IMAGE_BLUR}
        unoptimized
        onError={() => setSrc(getCityPlaceholder(city.city))}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className={`text-white font-bold leading-tight ${isMobile ? "text-xs" : "text-sm"}`}>
          {city.city}
        </p>
        <p className={`text-white/80 ${isMobile ? "text-[10px]" : "text-xs"}`}>
          {city.days}d · {city.country}
        </p>
      </div>
    </button>
  );
}
