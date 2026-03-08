"use client";

import { useCallback, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { useTripStore } from "@/stores/useTripStore";
import { nationalities } from "@/data/nationalities";
import { FormField } from "@/components/ui";
import { inputClass } from "@/components/auth/auth-styles";
import { AirportCombobox } from "@/components/ui/AirportCombobox";

interface ProfileStepProps {
  errors: Record<string, string>;
  clearError: (field: string) => void;
}

export function ProfileStep({ errors, clearError }: ProfileStepProps) {
  const nationality = useTripStore((s) => s.nationality);
  const setNationality = useTripStore((s) => s.setNationality);
  const homeAirport = useTripStore((s) => s.homeAirport);
  const setHomeAirport = useTripStore((s) => s.setHomeAirport);
  const tripDescription = useTripStore((s) => s.tripDescription);
  const setTripDescription = useTripStore((s) => s.setTripDescription);

  const [isListening, setIsListening] = useState(false);

  const toggleVoice = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }
    type SpeechRecognitionCtor = new () => {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onstart: (() => void) | null;
      onend: (() => void) | null;
      onerror: (() => void) | null;
      onresult:
        | ((event: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void)
        | null;
      start: () => void;
    };
    const SpeechRecognition: SpeechRecognitionCtor | undefined =
      ((window as Record<string, unknown>)["SpeechRecognition"] as
        | SpeechRecognitionCtor
        | undefined) ||
      ((window as Record<string, unknown>)["webkitSpeechRecognition"] as
        | SpeechRecognitionCtor
        | undefined);
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTripDescription(
        tripDescription.trim() ? `${tripDescription.trim()} ${transcript}` : transcript
      );
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  }, [isListening, tripDescription, setTripDescription]);

  return (
    <div>
      <h2 className="text-foreground text-2xl font-bold">A bit about you</h2>
      <p className="text-muted-foreground mt-2 text-sm">
        Help us personalise visa checks, flights, and your itinerary.
      </p>

      <div className="mt-8 space-y-5">
        <FormField label="Nationality" error={errors.nationality}>
          <select
            value={nationality}
            onChange={(e) => {
              setNationality(e.target.value);
              clearError("nationality");
            }}
            className={inputClass}
          >
            <option value="">Select nationality</option>
            {nationalities.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Home Airport" error={errors.homeAirport}>
          <AirportCombobox
            value={homeAirport}
            onChange={(v) => {
              setHomeAirport(v);
              clearError("homeAirport");
            }}
          />
        </FormField>
      </div>

      <div className="mt-8">
        <label className="text-foreground mb-2 block text-sm font-medium">
          Any special requests?{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <div className="relative">
          <textarea
            value={tripDescription}
            onChange={(e) => setTripDescription(e.target.value)}
            placeholder="e.g. We love street food and slow mornings. Prefer off-the-beaten-path spots over tourist traps. One of us has a shellfish allergy."
            rows={4}
            maxLength={2000}
            className={`${inputClass} resize-none pr-10`}
          />
          <button
            type="button"
            onClick={toggleVoice}
            className={`absolute right-2.5 bottom-2.5 rounded-full p-1.5 transition-all ${
              isListening
                ? "bg-accent animate-pulse text-white"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            }`}
            title={isListening ? "Stop listening" : "Speak your request"}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        </div>
        {tripDescription.length > 1800 && (
          <p className="text-muted-foreground mt-1 text-right text-xs">
            {2000 - tripDescription.length} characters remaining
          </p>
        )}
        <p className="text-muted-foreground mt-3 mb-2 text-xs">Quick add:</p>
        <div className="flex flex-wrap gap-2">
          {[
            "Street food lover 🍜",
            "Off the beaten path 🥾",
            "Shellfish allergy 🚫",
            "Slow mornings ☕",
            "Kid-friendly 👶",
            "Vegetarian 🥗",
          ].map((hint) => (
            <button
              key={hint}
              type="button"
              onClick={() =>
                setTripDescription(
                  tripDescription.trim() ? `${tripDescription.trim()} ${hint}` : hint
                )
              }
              className="border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground cursor-pointer rounded-full border px-3 py-1 text-xs transition-all"
            >
              {hint}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
