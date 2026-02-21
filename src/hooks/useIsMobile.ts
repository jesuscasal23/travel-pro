"use client";

import { useState, useEffect } from "react";

/**
 * SSR-safe responsive hook. Returns `null` until hydration completes,
 * then `true` (< breakpoint) or `false` (>= breakpoint).
 * Callers should render nothing / a skeleton while the value is null
 * to avoid a mobile↔desktop flash.
 */
export function useIsMobile(breakpoint = 768): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMobile;
}
