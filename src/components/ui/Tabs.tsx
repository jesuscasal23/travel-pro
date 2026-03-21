"use client";

import { type ReactNode, type KeyboardEvent, useRef, useCallback } from "react";

/* ── Tab list (container) ── */

interface TabListProps {
  children: ReactNode;
  label: string;
  className?: string;
}

export function TabList({ children, label, className = "" }: TabListProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tabs = ref.current?.querySelectorAll<HTMLElement>('[role="tab"]');
    if (!tabs?.length) return;

    const current = Array.from(tabs).findIndex((t) => t === document.activeElement);
    let next = current;

    if (e.key === "ArrowRight") next = (current + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;

    e.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  }, []);

  return (
    <div
      ref={ref}
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={`scrollbar-hide flex gap-2 overflow-x-auto ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Individual tab ── */

interface TabProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export function Tab({ active, onClick, children, className = "" }: TabProps) {
  return (
    <button
      role="tab"
      type="button"
      tabIndex={active ? 0 : -1}
      aria-selected={active}
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-brand-primary shadow-brand-sm text-white"
          : "bg-surface-soft text-prose hover:bg-edge"
      } ${className}`}
    >
      {children}
    </button>
  );
}

/* ── Tab panel ── */

interface TabPanelProps {
  children: ReactNode;
  className?: string;
}

export function TabPanel({ children, className = "" }: TabPanelProps) {
  return (
    <div role="tabpanel" className={`animate-tab-in ${className}`}>
      {children}
    </div>
  );
}
