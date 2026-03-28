"use client";

import { Home, Plane, ShoppingCart, User } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStatus } from "@/hooks/api";
import { useUnbookedCount } from "@/hooks/api/selections/useUnbookedCount";

const tabs = [
  { label: "Home", icon: Home, href: "/home" },
  { label: "Trips", icon: Plane, href: "/trips" },
  { label: "Cart", icon: ShoppingCart, href: "/cart" },
  { label: "Profile", icon: User, href: "/profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const isAuthenticated = useAuthStatus();
  const { data: unbookedCount } = useUnbookedCount({ enabled: isAuthenticated === true });

  if (isAuthenticated !== true) return null;

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 bg-white/85 shadow-[0_8px_24px_rgba(44,47,49,0.06)] backdrop-blur-xl dark:bg-slate-900/85">
      <div className="flex items-center justify-around p-2">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const showBadge = tab.href === "/cart" && unbookedCount != null && unbookedCount > 0;

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center rounded-full px-5 py-2 transition-all duration-200 ease-out ${
                isActive
                  ? "bg-primary shadow-primary/20 scale-90 text-white shadow-lg"
                  : "text-foreground/50 hover:text-primary dark:hover:text-primary dark:text-slate-400"
              }`}
            >
              <tab.icon size={20} strokeWidth={isActive ? 2 : 1.5} className="mb-1" />
              <span className="text-[11px] font-bold tracking-wider uppercase">{tab.label}</span>
              {showBadge && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {unbookedCount > 9 ? "9+" : unbookedCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
