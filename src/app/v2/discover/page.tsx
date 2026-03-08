"use client";

import { Search, Heart, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/v2/ui/BottomNav";

const trendingDestinations = [
  { name: "Kyoto, Japan", rating: 4.9, likes: "12,000", gradient: "from-amber-700 to-orange-900" },
  { name: "Santorini, Greece", rating: 4.8, likes: "9,500", gradient: "from-sky-400 to-blue-600" },
  {
    name: "Marrakech, Morocco",
    rating: 4.7,
    likes: "7,200",
    gradient: "from-orange-500 to-red-700",
  },
];

export default function DiscoverPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-4">
        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <h1 className="text-v2-navy text-2xl font-bold">Discover</h1>
        </div>

        {/* Search bar */}
        <div className="border-v2-border bg-v2-chip-bg mx-6 mb-6 flex items-center gap-3 rounded-xl border px-4 py-3">
          <Search size={18} className="text-v2-text-light" />
          <span className="text-v2-text-light text-sm">Where to next?</span>
        </div>

        {/* Trending Now section */}
        <div className="px-6">
          <h2 className="text-v2-navy mb-4 text-lg font-bold">Trending Now</h2>

          {/* Destination cards */}
          <div className="space-y-4">
            {trendingDestinations.map((dest) => (
              <div
                key={dest.name}
                className={`relative h-56 overflow-hidden rounded-2xl bg-gradient-to-br ${dest.gradient}`}
              >
                {/* Dark gradient overlay */}
                <div className="absolute right-0 bottom-0 left-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Heart button */}
                <button className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm">
                  <Heart size={18} className="text-white" />
                </button>

                {/* Destination name */}
                <p className="absolute bottom-10 left-4 text-lg font-bold text-white">
                  {dest.name}
                </p>

                {/* Rating row */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-white">{dest.rating}</span>
                  <span className="text-sm text-white/70">{dest.likes} likes</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
