"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";

interface TripNotFoundProps {
  isAuthenticated?: boolean;
}

export function TripNotFound({ isAuthenticated = true }: TripNotFoundProps) {
  return (
    <div className="bg-background min-h-screen">
      <Navbar isAuthenticated={isAuthenticated} />
      <div className="pt-32 text-center">
        <p className="text-muted-foreground mb-4 text-lg">Trip not found.</p>
        <Link href="/trips" className="btn-primary inline-block">
          Back to trips
        </Link>
      </div>
    </div>
  );
}
