"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";

interface TripNotFoundProps {
  isAuthenticated?: boolean;
}

export function TripNotFound({ isAuthenticated = true }: TripNotFoundProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={isAuthenticated} />
      <div className="pt-32 text-center">
        <p className="text-lg text-muted-foreground mb-4">Trip not found.</p>
        <Link href="/dashboard" className="btn-primary inline-block">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
