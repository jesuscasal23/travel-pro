"use client";

import { useRef, useCallback } from "react";
import type { DesktopTab } from "../types";

interface DesktopTabBarProps {
  activeTab: DesktopTab;
  onTabChange: (tab: DesktopTab) => void;
}

const TABS: { id: DesktopTab; emoji: string; label: string }[] = [
  { id: "journey", emoji: "✨", label: "Your Journey" },
  { id: "prep", emoji: "🎒", label: "Get Ready" },
  { id: "route", emoji: "🗺️", label: "Route" },
  { id: "accommodation", emoji: "🏨", label: "Accommodation" },
  { id: "flights", emoji: "✈️", label: "Flights" },
  { id: "budget", emoji: "💰", label: "Budget" },
];

export function DesktopTabBar({ activeTab, onTabChange }: DesktopTabBarProps) {
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
    <div className="bg-background/95 border-border sticky top-16 z-30 border-b backdrop-blur-sm">
      <div className="mx-auto max-w-[960px] px-4 py-3">
        <div
          ref={containerRef}
          role="tablist"
          aria-label="Trip sections"
          onKeyDown={handleKeyDown}
          className="flex items-center justify-center gap-2"
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
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground scale-105 shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <span>{tab.emoji}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
