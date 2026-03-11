"use client";

import { useTripStore } from "@/stores/useTripStore";
import { TravelStyleSelector } from "@/components/profile/TravelStyleSelector";

export function StyleStep() {
  const travelStyle = useTripStore((s) => s.travelStyle);
  const setTravelStyle = useTripStore((s) => s.setTravelStyle);

  return (
    <div className="space-y-6 pb-2">
      <div>
        <h2 className="text-v2-navy text-[28px] leading-tight font-bold">
          What level of trip are you after?
        </h2>
        <p className="text-v2-text-muted mt-2 text-sm">
          Choose the base comfort level and we&apos;ll calibrate hotels, transport, and activities
          around it.
        </p>
      </div>

      <section>
        <p className="text-v2-text-muted mb-3 text-xs font-bold tracking-[0.22em] uppercase">
          Travel Style
        </p>
        <TravelStyleSelector value={travelStyle} onChange={setTravelStyle} variant="grid" />
      </section>
    </div>
  );
}
