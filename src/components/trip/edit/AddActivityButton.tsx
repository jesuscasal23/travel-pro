"use client";

import { useRef, useState, useEffect } from "react";
import { Plus, PenLine, Sparkles } from "lucide-react";

interface AddActivityButtonProps {
  onAddManual: () => void;
  onAddAI: () => void;
  isGeneratingAI: boolean;
}

export function AddActivityButton({
  onAddManual,
  onAddAI,
  isGeneratingAI,
}: AddActivityButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative mt-1">
      <button
        onClick={() => setMenuOpen((o) => !o)}
        className="text-primary hover:text-primary/80 flex items-center gap-1.5 px-1 py-2 text-sm transition-colors"
        aria-label="Add activity"
      >
        <Plus className="h-4 w-4" />
        Add activity
      </button>

      {menuOpen && (
        <div className="bg-background border-border absolute bottom-full left-0 z-20 mb-1 min-w-[180px] overflow-hidden rounded-xl border shadow-lg">
          <button
            onClick={() => {
              setMenuOpen(false);
              onAddManual();
            }}
            className="text-foreground hover:bg-muted flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm transition-colors"
          >
            <PenLine className="text-muted-foreground h-4 w-4" />
            Add manually
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              onAddAI();
            }}
            disabled={isGeneratingAI}
            className="text-foreground hover:bg-muted flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm transition-colors disabled:opacity-50"
          >
            <Sparkles className="text-primary h-4 w-4" />
            {isGeneratingAI ? "Generating…" : "Suggest with AI"}
          </button>
        </div>
      )}
    </div>
  );
}
