"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CalendarDays, Map, ReceiptText, Wallet } from "lucide-react";
import { usePathname } from "next/navigation";

const sections = [
  { id: "overview", label: "Overview", icon: ReceiptText, href: "" },
  { id: "itinerary", label: "Itinerary", icon: CalendarDays, href: "/itinerary" },
  { id: "bookings", label: "Bookings", icon: ReceiptText, href: "/bookings" },
  { id: "budget", label: "Budget", icon: Wallet, href: "/budget" },
  { id: "map", label: "Map", icon: Map, href: "/map" },
];

interface TripSectionNavProps {
  tripId: string;
}

export function TripSectionNav({ tripId }: TripSectionNavProps) {
  const pathname = usePathname();
  const activeSectionRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    activeSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [pathname]);

  return (
    <div className="px-6 py-4">
      <div
        aria-label="Trip sections"
        className="scrollbar-thin flex touch-pan-x gap-2 overflow-x-auto overscroll-x-contain pb-2"
      >
        {sections.map((section) => {
          const href = `/trips/${tripId}${section.href}`;
          const isActive = pathname === href;
          const Icon = section.icon;

          return (
            <Link
              key={section.id}
              href={href}
              ref={isActive ? activeSectionRef : undefined}
              className={`flex shrink-0 snap-start items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-brand-primary bg-brand-primary text-white shadow-[var(--shadow-brand-md)]"
                  : "text-v2-text-muted border-white/80 bg-white/88 shadow-[0_14px_26px_rgba(27,43,75,0.05)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{section.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
