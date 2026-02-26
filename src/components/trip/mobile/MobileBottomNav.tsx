"use client";

import { useRef, useCallback } from "react";
import type { MobileTab } from "../types";

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

const TABS: { id: MobileTab; emoji: string; label: string }[] = [
  { id: "journey", emoji: "✨", label: "Journey" },
  { id: "prep", emoji: "🎒", label: "Prep" },
  { id: "accommodation", emoji: "🏨", label: "Stay" },
  { id: "flights", emoji: "✈️", label: "Flights" },
  { id: "budget", emoji: "💰", label: "Budget" },
];

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const idx = TABS.findIndex((t) => t.id === activeTab);
      let next = idx;
      if (e.key === "ArrowRight") next = Math.min(idx + 1, TABS.length - 1);
      else if (e.key === "ArrowLeft") next = Math.max(idx - 1, 0);
      else return;

      e.preventDefault();
      onTabChange(TABS[next].id);
      const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]");
      buttons?.[next]?.focus();
    },
    [activeTab, onTabChange]
  );

  return (
    <nav className="bg-background/95 border-border fixed right-0 bottom-0 left-0 z-40 border-t backdrop-blur-lg">
      <div
        ref={containerRef}
        role="tablist"
        aria-label="Trip sections"
        onKeyDown={handleKeyDown}
        className="flex h-14 items-center justify-around"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span className="text-lg">{tab.emoji}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
