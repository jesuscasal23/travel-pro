"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
  isAuthenticated?: boolean;
}

export function Navbar({ isAuthenticated = false }: NavbarProps) {
  return (
    <nav className="bg-background/95 border-border fixed top-0 right-0 left-0 z-50 h-16 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href={isAuthenticated ? "/trips" : "/get-started"} className="flex items-center gap-2">
          <span className="text-primary text-xl font-bold">Travel Pro</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isAuthenticated ? (
            <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full">
              <User className="h-4 w-4" />
            </div>
          ) : (
            <Link href="/login" className="btn-ghost px-4 py-2 text-sm">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
