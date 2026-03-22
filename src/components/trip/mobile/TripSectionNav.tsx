"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CalendarDays, Hotel, Map, Plane, ReceiptText, Wallet } from "lucide-react";
import { usePathname } from "next/navigation";

const sections = [
  { id: "overview", label: "Overview", icon: ReceiptText, href: "" },
  { id: "itinerary", label: "Itinerary", icon: CalendarDays, href: "/itinerary" },
  { id: "flights", label: "Flights", icon: Plane, href: "/flights" },
  { id: "hotels", label: "Hotels", icon: Hotel, href: "/hotels" },
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
    <div className="px-6 py-3">
      <div
        aria-label="Trip sections"
        className="scrollbar-hide flex touch-pan-x gap-1 overflow-x-auto overscroll-x-contain"
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
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={isActive ? 2.5 : 1.5} />
              <span>{section.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
