"use client";

import { useRef, useState, useEffect } from "react";
import { Plus, PenLine, Sparkles } from "lucide-react";

interface AddActivityButtonProps {
  onAddManual: () => void;
  onAddAI: () => void;
  isGeneratingAI: boolean;
}

export function AddActivityButton({ onAddManual, onAddAI, isGeneratingAI }: AddActivityButtonProps) {
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
        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors py-2 px-1"
        aria-label="Add activity"
      >
        <Plus className="w-4 h-4" />
        Add activity
      </button>

      {menuOpen && (
        <div className="absolute bottom-full left-0 mb-1 z-20 bg-background border border-border rounded-xl shadow-lg overflow-hidden min-w-[180px]">
          <button
            onClick={() => {
              setMenuOpen(false);
              onAddManual();
            }}
            className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors text-left"
          >
            <PenLine className="w-4 h-4 text-muted-foreground" />
            Add manually
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              onAddAI();
            }}
            disabled={isGeneratingAI}
            className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors text-left disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            {isGeneratingAI ? "Generating…" : "Suggest with AI"}
          </button>
        </div>
      )}
    </div>
  );
}
