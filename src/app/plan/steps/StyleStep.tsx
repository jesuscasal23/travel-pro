"use client";

import { Check } from "lucide-react";
import { useTripStore } from "@/stores/useTripStore";
import { travelStyles } from "@/data/travelStyles";

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
        <div className="grid grid-cols-3 gap-3">
          {travelStyles.map((style) => {
            const isSelected = travelStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => setTravelStyle(style.id)}
                aria-pressed={isSelected}
                className={`relative rounded-[22px] border px-3 py-4 text-center transition-all ${
                  isSelected
                    ? "bg-v2-orange border-v2-orange text-white shadow-[0_14px_30px_rgba(249,115,22,0.24)]"
                    : "border-v2-border text-v2-navy bg-white"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/25">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className="text-2xl">{style.emoji}</div>
                <div className="mt-2 text-sm font-bold">{style.label}</div>
                <p className="mt-1 text-[11px] leading-relaxed opacity-80">{style.description}</p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
