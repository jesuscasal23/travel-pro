"use client";

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

  return (
    <div className="scrollbar-hide flex gap-2 overflow-x-auto px-6 py-4">
      {sections.map((section) => {
        const href = `/trips/${tripId}${section.href}`;
        const isActive = pathname === href;
        const Icon = section.icon;

        return (
          <Link
            key={section.id}
            href={href}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${
              isActive
                ? "border-[#2563ff] bg-[#2563ff] text-white shadow-[0_16px_30px_rgba(37,99,255,0.22)]"
                : "border-white/80 bg-white/88 text-[#6d7b91] shadow-[0_14px_26px_rgba(27,43,75,0.05)]"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{section.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
