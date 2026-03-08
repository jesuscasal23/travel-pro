"use client";

import { Home, Map, Compass, CalendarCheck, User } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const tabs = [
  { label: "Home", icon: Home, href: "/v2/home" },
  { label: "Trips", icon: Map, href: "/v2/trips" },
  { label: "Discover", icon: Compass, href: "/v2/discover" },
  { label: "Bookings", icon: CalendarCheck, href: "/v2/bookings" },
  { label: "Profile", icon: User, href: "/v2/profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="border-v2-border flex items-center justify-around border-t bg-white px-2 pt-3 pb-6">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex flex-col items-center gap-1 text-xs transition-colors ${
              isActive
                ? "text-v2-navy font-semibold"
                : "text-v2-text-light hover:text-v2-text-muted"
            }`}
          >
            <tab.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
