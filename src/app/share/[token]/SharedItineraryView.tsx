"use client";

import dynamic from "next/dynamic";
import { MapPin, Calendar, Users } from "lucide-react";
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {cities.map((c) => c.city).join(" → ")}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {totalDays} days · {trip.dateStart} – {trip.dateEnd}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {trip.travelers} traveller{trip.travelers !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Map */}
      {cities.length > 0 && (
        <div className="mb-8 h-64 rounded-2xl overflow-hidden border border-border">
          <RouteMap cities={cities} activeCityIndex={null} onCityClick={() => {}} />
        </div>
      )}

      {/* Route chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {cities.map((city, i) => (
          <div key={city.id} className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-full text-sm font-medium text-foreground">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              {city.city}
              <span className="text-muted-foreground text-xs">({city.days}d)</span>
            </span>
            {i < cities.length - 1 && (
              <span className="text-muted-foreground text-sm">→</span>
            )}
          </div>
        ))}
      </div>

      {/* Day-by-day */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Day-by-Day Plan</h2>
        {(itinerary.days ?? []).map((day) => (
          <div key={day.day} className="card-travel p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full">
                Day {day.day}
              </span>
              <span className="font-semibold text-foreground">{day.city}</span>
              {day.isTravel && (
                <span className="text-xs badge-info">Travel Day</span>
              )}
            </div>

            {day.isTravel ? (
              <p className="text-sm text-muted-foreground">
                ✈ {day.travelFrom} → {day.travelTo}
                {day.travelDuration && ` · ${day.travelDuration}`}
              </p>
            ) : (
              <div className="space-y-3">
                {day.activities.map((activity, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-xl shrink-0">{activity.icon}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm">{activity.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{activity.why}</p>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        {activity.duration && <span>{activity.duration}</span>}
                        {activity.cost && <span>{activity.cost}</span>}
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
      <div className="mt-12 p-8 bg-primary/5 border border-primary/20 rounded-2xl text-center">
        <h3 className="text-xl font-bold text-foreground mb-2">
          Want your own personalised itinerary?
        </h3>
        <p className="text-muted-foreground text-sm mb-6">
          Travel Pro generates AI-crafted trips in minutes — with visa checks, weather insights, and booking links.
        </p>
        <a href="/signup" className="btn-primary inline-flex">
          Plan your trip for free →
        </a>
      </div>
    </div>
  );
}
