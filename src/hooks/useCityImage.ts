"use client";

import { useEffect, useState, useCallback } from "react";
import { getCityImage, getCityPlaceholder } from "@/lib/utils/city-images";

/**
 * Manages a city hero image with automatic placeholder fallback on error.
 * Returns [src, onError] — wire onError to the <img>/<Image> element.
 */
export function useCityImage(cityName: string, countryCode?: string) {
  const desiredSrc = countryCode
    ? getCityImage(cityName, countryCode)
    : getCityPlaceholder(cityName);
  const [src, setSrc] = useState(desiredSrc);

  useEffect(() => {
    setSrc(desiredSrc);
  }, [desiredSrc]);

  const onError = useCallback(() => setSrc(getCityPlaceholder(cityName)), [cityName]);
  return [src, onError] as const;
}
