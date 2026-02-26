"use client";

import dynamic from "next/dynamic";
import { MapPin, Calendar, Users } from "lucide-react";
import { getCategoryEmoji } from "@/lib/utils/category-colors";
import type { Itinerary } from "@/types";
import type { Trip } from "@prisma/client";

const RouteMap = dynamic(() => import("@/components/map/RouteMap"), { ssr: false });

interface Props {
  itinerary: Itinerary;
  trip: Trip;
}

export default function SharedItineraryView({ itinerary, trip }: Props) {
  const cities = itinerary.route ?? [];
  const totalDays = cities.reduce((sum, c) => sum + c.days, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-foreground mb-2 text-3xl font-bold">
          {cities.map((c) => c.city).join(" → ")}
        </h1>
        <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {totalDays} days · {trip.dateStart} – {trip.dateEnd}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {trip.travelers} traveller{trip.travelers !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Map */}
      {cities.length > 0 && (
        <div className="border-border mb-8 h-64 overflow-hidden rounded-2xl border">
          <RouteMap cities={cities} activeCityIndex={null} onCityClick={() => {}} />
        </div>
      )}

      {/* Route chips */}
      <div className="mb-8 flex flex-wrap gap-2">
        {cities.map((city, i) => (
          <div key={city.id} className="flex items-center gap-2">
            <span className="bg-secondary text-foreground flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium">
              <MapPin className="text-primary h-3.5 w-3.5" />
              {city.city}
              <span className="text-muted-foreground text-xs">({city.days}d)</span>
            </span>
            {i < cities.length - 1 && <span className="text-muted-foreground text-sm">→</span>}
          </div>
        ))}
      </div>

      {/* Day-by-day */}
      <div className="space-y-4">
        <h2 className="text-foreground text-xl font-semibold">Day-by-Day Plan</h2>
        {(itinerary.days ?? []).map((day) => (
          <div key={day.day} className="card-travel p-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="bg-primary rounded-full px-2.5 py-1 text-xs font-bold text-white">
                Day {day.day}
              </span>
              <span className="text-foreground font-semibold">{day.city}</span>
              {day.isTravel && <span className="badge-info text-xs">Travel Day</span>}
            </div>

            {day.isTravel ? (
              <p className="text-muted-foreground text-sm">
                ✈ {day.travelFrom} → {day.travelTo}
                {day.travelDuration && ` · ${day.travelDuration}`}
              </p>
            ) : (
              <div className="space-y-3">
                {day.activities.map((activity, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="shrink-0 text-xl">
                      {activity.icon ?? getCategoryEmoji(activity.category)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-foreground text-sm font-medium">{activity.name}</p>
                      <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                        {activity.why}
                      </p>
                      <div className="text-muted-foreground mt-1 flex gap-3 text-xs">
                        {activity.duration && <span>{activity.duration}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="bg-primary/5 border-primary/20 mt-12 rounded-2xl border p-8 text-center">
        <h3 className="text-foreground mb-2 text-xl font-bold">
          Want your own personalised itinerary?
        </h3>
        <p className="text-muted-foreground mb-6 text-sm">
          Travel Pro generates AI-crafted trips in minutes — with visa checks, weather insights, and
          booking links.
        </p>
        <a href="/signup" className="btn-primary inline-flex">
          Plan your trip for free →
        </a>
      </div>
    </div>
  );
}
