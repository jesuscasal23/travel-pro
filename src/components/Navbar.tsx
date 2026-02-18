"use client";

import Link from "next/link";
import { User } from "lucide-react";

interface NavbarProps {
  isAuthenticated?: boolean;
  displayName?: string;
}

export function Navbar({ isAuthenticated = false, displayName = "Thomas" }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">Travel Pro</span>
        </Link>

        {/* Right side */}
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block">
              {displayName}
            </span>
          </div>
        ) : (
          <Link href="/onboarding" className="btn-ghost text-sm py-2 px-4">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
