"use client";

import { memo } from "react";
import Image from "next/image";
import { CITY_IMAGE_BLUR } from "@/lib/utils/city-images";
import { useCityImage } from "@/hooks/useCityImage";
import type { CityStop } from "@/types";

interface CityCardProps {
  city: CityStop;
  isActive: boolean;
  onClick: () => void;
  variant: "mobile" | "desktop";
}

export const CityCard = memo(function CityCard({
  city,
  isActive,
  onClick,
  variant,
}: CityCardProps) {
  const isMobile = variant === "mobile";
  const [src, onImgError] = useCityImage(city.city, city.countryCode);

  return (
    <button
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={onClick}
      className={`group relative flex-shrink-0 overflow-hidden ${
        isMobile ? "h-32 w-24 rounded-2xl" : "h-[200px] min-w-[160px] rounded-2xl"
      } shadow-glass border border-white/70 ${
        isActive ? "ring-brand-primary ring-2 ring-offset-2 ring-offset-[#f8fbff]" : ""
      } ${!isMobile ? "transition-transform duration-200 hover:scale-105" : ""}`}
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
        onError={onImgError}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute right-0 bottom-0 left-0 p-2">
        <p className={`leading-tight font-bold text-white ${isMobile ? "text-xs" : "text-sm"}`}>
          {city.city}
        </p>
        <p className={`text-white/80 ${isMobile ? "text-[10px]" : "text-xs"}`}>
          {city.days}d · {city.country}
        </p>
      </div>
    </button>
  );
});
