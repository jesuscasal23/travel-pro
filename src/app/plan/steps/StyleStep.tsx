"use client";

import { useTripStore } from "@/stores/useTripStore";
import { interestOptions } from "@/data/sampleData";
import { FormField } from "@/components/ui";
import { ChipGroup } from "@/components/ui/Chip";
import { TravelStylePicker } from "@/components/TravelStylePicker";

export function StyleStep() {
  const travelStyle = useTripStore((s) => s.travelStyle);
  const setTravelStyle = useTripStore((s) => s.setTravelStyle);
  const pace = useTripStore((s) => s.pace);
  const setPace = useTripStore((s) => s.setPace);
  const interests = useTripStore((s) => s.interests);
  const toggleInterest = useTripStore((s) => s.toggleInterest);

  return (
    <div>
      <h2 className="text-foreground text-2xl font-bold">Your travel style</h2>
      <p className="text-muted-foreground mt-2 text-sm">
        Help us personalise every trip we plan for you.
      </p>

      <div className="mt-8 space-y-8">
        <FormField label="Travel Style">
          <TravelStylePicker value={travelStyle} onChange={setTravelStyle} compact />
        </FormField>
        <FormField label="Trip Pace">
          <div className="bg-secondary flex gap-0 rounded-xl p-1">
            {(
              [
                { value: "relaxed", label: "Relaxed", sub: "1–2 activities/day" },
                { value: "moderate", label: "Balanced", sub: "3–4 activities/day" },
                { value: "active", label: "Active", sub: "5+ activities/day" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPace(opt.value)}
                className={`flex-1 rounded-lg px-3 py-2.5 text-center transition-all ${
                  pace === opt.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="mt-0.5 text-xs opacity-70">{opt.sub}</div>
              </button>
            ))}
          </div>
        </FormField>
        <FormField label="Interests">
          <ChipGroup options={interestOptions} selected={interests} onToggle={toggleInterest} />
        </FormField>
      </div>
    </div>
  );
}
