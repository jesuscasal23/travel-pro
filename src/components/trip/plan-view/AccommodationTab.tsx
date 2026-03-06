"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Hotel,
  Star,
  ExternalLink,
  MapPin,
  Loader2,
  AlertTriangle,
  Search,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useTripStore } from "@/stores/useTripStore";
import type { Itinerary, CityAccommodation } from "@/types";

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

function useManualAccommodationFetch(itinerary: Itinerary) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    data: CityAccommodation[] | null;
    error: string | null;
    status: number | null;
    raw: unknown;
  } | null>(null);

  const dateStart = useTripStore((s) => s.dateStart);
  const travelers = useTripStore((s) => s.travelers) || 1;
  const travelStyle = useTripStore((s) => s.travelStyle) || "comfort";
  const setItinerary = useTripStore((s) => s.setItinerary);

  const fetch_ = async () => {
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        route: itinerary.route.map((r) => ({
          id: r.id,
          city: r.city,
          country: r.country,
          countryCode: r.countryCode,
          lat: r.lat,
          lng: r.lng,
          days: r.days,
          iataCode: r.iataCode,
        })),
        dateStart,
        travelers,
        travelStyle,
      };
      const res = await fetch("/api/v1/enrich/accommodation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      const accomData = body.accommodationData ?? null;
      setResult({
        data: accomData,
        error: res.ok ? null : (body.error ?? `HTTP ${res.status}`),
        status: res.status,
        raw: body,
      });

      // If we got data, sync it back to the store
      if (res.ok && accomData && accomData.length > 0) {
        const current = useTripStore.getState().itinerary;
        if (current) {
          setItinerary({ ...current, accommodationData: accomData });
        }
      }
    } catch (e) {
      setResult({
        data: null,
        error: e instanceof Error ? e.message : "Network error",
        status: null,
        raw: null,
      });
    } finally {
      setLoading(false);
    }
  };

  return { loading, result, fetch: fetch_ };
}

function ManualFetchButton({ itinerary }: { itinerary: Itinerary }) {
  const { loading, result, fetch: doFetch } = useManualAccommodationFetch(itinerary);

  return (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" onClick={doFetch} loading={loading} className="gap-1.5">
        <RefreshCw className="h-3.5 w-3.5" />
        Fetch hotels now
      </Button>
      {result && (
        <div className="border-border bg-secondary/50 max-h-60 overflow-auto rounded-lg border p-3">
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span
              className={`rounded-full px-2 py-0.5 font-medium ${
                result.error
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              }`}
            >
              {result.status ?? "ERR"}
            </span>
            {result.error && <span className="text-red-600 dark:text-red-400">{result.error}</span>}
            {result.data && (
              <span className="text-muted-foreground">
                {result.data.length} cities, {result.data.reduce((s, c) => s + c.hotels.length, 0)}{" "}
                hotels total
              </span>
            )}
          </div>
          <pre className="text-muted-foreground text-[11px] leading-relaxed whitespace-pre-wrap">
            {JSON.stringify(result.raw, null, 2)}
          </pre>
        </div>
      )}
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
        </div>
        <div className="card-travel space-y-3 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-accent mt-0.5 h-5 w-5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-foreground text-sm font-medium">
                Could not load hotel recommendations
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                The hotel search service returned an error. This can happen when the Amadeus API is
                unavailable or not configured. You can still browse options using the links below.
              </p>
            </div>
          </div>
        </div>
        <ManualFetchButton itinerary={itinerary} />
        <FallbackCards route={route} accommodationData={accommodationData} />
      </div>
    );
  }

  if (!accommodationData || accommodationData.length === 0) {
    const hasNoHotels = accommodationData && accommodationData.every((a) => a.hotels.length === 0);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Hotel className="text-primary h-5 w-5" />
          <h2 className="text-foreground text-lg font-semibold">Accommodation</h2>
        </div>

        {hasNoHotels ? (
          <div className="card-travel space-y-3 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-accent mt-0.5 h-5 w-5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-foreground text-sm font-medium">
                  Hotel search is currently unavailable
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Live hotel prices and recommendations require the Amadeus API. You can still
                  browse options using the links below.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="card-travel space-y-3 p-5">
            <div className="flex items-start gap-3">
              <Search className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-foreground text-sm font-medium">No hotel data yet</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Accommodation suggestions will appear once your itinerary is fully generated. In
                  the meantime, you can search manually below.
                </p>
              </div>
            </div>
          </div>
        )}

        <ManualFetchButton itinerary={itinerary} />
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
