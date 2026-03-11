"use client";

import { useCallback, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { travelInputClass } from "@/components/forms/travel-field-styles";
import { useTripStore } from "@/stores/useTripStore";

interface TripDescriptionCardProps {
  compact?: boolean;
}

const quickAddHints = [
  "Street food lover",
  "Off the beaten path",
  "Shellfish allergy",
  "Slow mornings",
];

export function TripDescriptionCard({ compact = false }: TripDescriptionCardProps) {
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
    <section className="border-v2-border rounded-[24px] border bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-v2-navy text-sm font-semibold">Anything special we should know?</p>
          <p className="text-v2-text-muted mt-1 text-sm">
            Preferences, food restrictions, or trip goals we should bake in.
          </p>
        </div>
        <span className="text-v2-text-muted shrink-0 text-xs font-medium">Optional</span>
      </div>

      <div className="relative">
        <textarea
          value={tripDescription}
          onChange={(event) => setTripDescription(event.target.value)}
          placeholder="Street food, slow mornings, local neighborhoods, no shellfish."
          rows={compact ? 3 : 4}
          maxLength={2000}
          className={`${travelInputClass} ${compact ? "min-h-[108px]" : "min-h-[132px]"} resize-none pr-12`}
        />
        <button
          type="button"
          onClick={toggleVoice}
          className={`absolute right-3 bottom-3 rounded-full p-2 transition-colors ${
            isListening
              ? "bg-v2-orange text-white"
              : "bg-v2-chip-bg text-v2-text-muted hover:text-v2-navy"
          }`}
          title={isListening ? "Stop listening" : "Speak your request"}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className="text-v2-text-muted text-xs">
          This helps us make the first draft more relevant.
        </p>
        <span className="text-v2-text-muted text-xs">{2000 - tripDescription.length}</span>
      </div>

      {!compact && (
        <div className="mt-3 flex flex-wrap gap-2">
          {quickAddHints.map((hint) => (
            <button
              key={hint}
              type="button"
              onClick={() =>
                setTripDescription(
                  tripDescription.trim() ? `${tripDescription.trim()} ${hint}` : hint
                )
              }
              className="bg-v2-chip-bg text-v2-navy hover:bg-v2-surface rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
            >
              {hint}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
