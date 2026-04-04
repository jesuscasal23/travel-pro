import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCityImage } from "@/hooks/useCityImage";
import { getCityImage, getCityPlaceholder } from "@/lib/utils/city-images";

describe("useCityImage", () => {
  it("updates the source when the requested city changes", () => {
    type Props = { cityName: string; countryCode?: string };

    const { result, rerender } = renderHook<ReturnType<typeof useCityImage>, Props>(
      ({ cityName, countryCode }: Props) => useCityImage(cityName, countryCode),
      {
        initialProps: { cityName: "Fallback Trip" },
      }
    );

    expect(result.current[0]).toBe(getCityPlaceholder("Fallback Trip"));

    rerender({ cityName: "Caracas", countryCode: "VE" });

    expect(result.current[0]).toBe(getCityImage("Caracas", "VE"));
  });

  it("falls back to a placeholder after an image error", () => {
    const { result } = renderHook(() => useCityImage("Caracas", "VE"));

    expect(result.current[0]).toBe(getCityImage("Caracas", "VE"));

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe(getCityPlaceholder("Caracas"));
  });
});
