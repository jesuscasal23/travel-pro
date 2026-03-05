"use client";

import { motion } from "framer-motion";
import { Hotel, Star, ExternalLink, MapPin, Loader2, AlertTriangle, Search } from "lucide-react";
import type { Itinerary } from "@/types";

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

interface AccommodationTabProps {
  itinerary: Itinerary;
  tripId: string;
  accommodationLoading?: boolean;
  accommodationError?: boolean;
}

function SkeletonCard() {
  return (
    <div className="card-travel animate-pulse space-y-3 p-4">
      <div className="flex items-center gap-2">
        <div className="bg-secondary h-5 w-5 rounded" />
        <div className="bg-secondary h-5 w-32 rounded" />
      </div>
      <div className="bg-secondary h-3 w-24 rounded" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-background border-border rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div className="bg-secondary h-4 w-40 rounded" />
              <div className="bg-secondary h-4 w-20 rounded" />
            </div>
            <div className="bg-secondary mt-2 h-3 w-56 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AccommodationTab({
  itinerary,
  accommodationLoading,
  accommodationError,
}: AccommodationTabProps) {
  const accommodationData = itinerary.accommodationData;
  const route = itinerary.route;

  if (accommodationLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Hotel className="text-primary h-5 w-5" />
          <h2 className="text-foreground text-lg font-semibold">Accommodation</h2>
          <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
            <Loader2 className="h-3 w-3 animate-spin" /> Finding hotels…
          </span>
        </div>
        <div className="space-y-4">
          {route.map((stop) => (
            <SkeletonCard key={stop.id} />
          ))}
        </div>
      </div>
    );
  }

  if (accommodationError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Hotel className="text-primary h-5 w-5" />
          <h2 className="text-foreground text-lg font-semibold">Accommodation</h2>
          <span className="text-accent inline-flex items-center gap-1.5 text-xs">
            <AlertTriangle className="h-3 w-3" /> Unavailable
          </span>
        </div>
        <FallbackCards route={route} accommodationData={accommodationData} />
      </div>
    );
  }

  if (!accommodationData || accommodationData.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Hotel className="text-primary h-5 w-5" />
          <h2 className="text-foreground text-lg font-semibold">Accommodation</h2>
        </div>
        <FallbackCards route={route} accommodationData={accommodationData} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Hotel className="text-primary h-5 w-5" />
        <h2 className="text-foreground text-lg font-semibold">Accommodation</h2>
      </div>

      <div className="space-y-4">
        {accommodationData.map((cityAccom, i) => (
          <motion.div
            key={cityAccom.city}
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ delay: i * 0.05 }}
            className="card-travel space-y-3 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="text-primary h-4 w-4" />
                <h3 className="text-foreground font-medium">{cityAccom.city}</h3>
              </div>
              <span className="text-muted-foreground text-xs">
                {cityAccom.checkIn} → {cityAccom.checkOut}
              </span>
            </div>

            {cityAccom.hotels.length > 0 ? (
              <div className="space-y-2">
                {cityAccom.hotels.map((hotel) => (
                  <a
                    key={hotel.hotelId}
                    href={hotel.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-background border-border hover:border-primary/30 group block rounded-lg border p-3 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-foreground truncate text-sm font-medium">
                            {hotel.name}
                          </span>
                          <ExternalLink className="text-muted-foreground h-3 w-3 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        {hotel.rating && (
                          <div className="mt-0.5 flex items-center gap-0.5">
                            {Array.from({ length: hotel.rating }).map((_, j) => (
                              <Star key={j} className="h-3 w-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        )}
                      </div>
                      {hotel.pricePerNight != null && (
                        <div className="flex-shrink-0 text-right">
                          <span className="text-foreground text-sm font-semibold">
                            €{hotel.pricePerNight}
                          </span>
                          <span className="text-muted-foreground text-xs">/night</span>
                        </div>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                      {hotel.why}
                    </p>
                    {hotel.distance && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {hotel.distance} from center
                      </p>
                    )}
                  </a>
                ))}
              </div>
            ) : (
              <a
                href={cityAccom.fallbackSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-background border-border hover:border-primary/30 flex items-center gap-3 rounded-lg border p-4 transition-colors"
              >
                <Search className="text-primary h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-foreground text-sm font-medium">
                    Search hotels in {cityAccom.city}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Browse available options on Booking.com
                  </p>
                </div>
                <ExternalLink className="text-muted-foreground ml-auto h-4 w-4" />
              </a>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function FallbackCards({
  route,
  accommodationData,
}: {
  route: Itinerary["route"];
  accommodationData?: Itinerary["accommodationData"];
}) {
  return (
    <div className="space-y-3">
      {route.map((stop) => {
        const cityAccom = accommodationData?.find((a) => a.city === stop.city);
        const fallbackUrl = cityAccom?.fallbackSearchUrl;

        return (
          <a
            key={stop.id}
            href={
              fallbackUrl ??
              `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(stop.city)}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="card-travel hover:border-primary/30 flex items-center gap-3 p-4 transition-colors"
          >
            <Search className="text-primary h-5 w-5 flex-shrink-0" />
            <div>
              <p className="text-foreground text-sm font-medium">Search hotels in {stop.city}</p>
              <p className="text-muted-foreground text-xs">
                Browse available options on Booking.com
              </p>
            </div>
            <ExternalLink className="text-muted-foreground ml-auto h-4 w-4" />
          </a>
        );
      })}
    </div>
  );
}
