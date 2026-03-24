"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Check,
  Hotel,
  Star,
  MapPin,
  Loader2,
  Search,
  RefreshCw,
  ArrowRight,
  X,
} from "lucide-react";
import {
  getAccommodationQueryKey,
  fetchAccommodationEnrichment,
  useTravelerPreferences,
} from "@/hooks/api";
import { useAuthStatus } from "@/hooks/api/auth/useAuthStatus";
import { useBookingClicks } from "@/hooks/api/booking-clicks/useBookingClicks";
import { useConfirmBooking } from "@/hooks/api/booking-clicks/useConfirmBooking";
import { Badge } from "@/components/ui/Badge";
import { AlertBox } from "@/components/ui/AlertBox";
import { useTripStore } from "@/stores/useTripStore";
import { useTripContext } from "../TripContext";
import type {
  Itinerary,
  CityAccommodation,
  CityHotel,
  BookingClick,
  BookingClickMetadata,
} from "@/types";

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

/** Format YYYY-MM-DD → "Oct 24" */
function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

interface AccommodationTabProps {
  itinerary: Itinerary;
  tripId: string;
}

/* ─── Skeleton Loading Card ─── */
function SkeletonHotelCard() {
  return (
    <div className="bg-card shadow-card animate-pulse overflow-hidden rounded-xl">
      <div className="bg-secondary h-48 w-full" />
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between">
          <div className="bg-secondary h-5 w-40 rounded" />
          <div className="bg-secondary h-6 w-12 rounded-lg" />
        </div>
        <div className="bg-secondary h-3 w-full rounded" />
        <div className="bg-secondary h-3 w-3/4 rounded" />
        <div className="border-border flex items-center justify-between border-t pt-3">
          <div className="bg-secondary h-7 w-24 rounded" />
          <div className="bg-secondary h-10 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ─── Individual Hotel Card (matches flights card design language) ─── */
function HotelCard({ hotel }: { hotel: CityHotel }) {
  return (
    <div className="bg-card shadow-card hover:shadow-card-hover group overflow-hidden rounded-xl transition-shadow">
      {/* Hotel image or gradient fallback */}
      <div className="relative h-48 overflow-hidden">
        {hotel.imageUrl ? (
          <img
            src={hotel.imageUrl}
            alt={hotel.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="from-primary/10 to-primary/5 flex h-full w-full items-center justify-center bg-gradient-to-br">
            <Hotel className="text-primary/20 h-12 w-12" />
          </div>
        )}
        {hotel.rating && hotel.rating >= 4.5 && (
          <div className="absolute top-3 left-3">
            <Badge variant="brand">Premium</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 p-5">
        {/* Name + rating */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-foreground text-lg leading-tight font-bold">
              {hotel.name}
            </h3>
            {hotel.rating != null && (
              <div className="bg-secondary flex shrink-0 items-center gap-1 rounded-lg px-2 py-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-foreground text-xs font-bold">{hotel.rating}</span>
              </div>
            )}
          </div>
          {hotel.why && (
            <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm leading-relaxed">
              {hotel.why}
            </p>
          )}
        </div>

        {/* Amenity badges */}
        <div className="flex flex-wrap gap-2">
          {hotel.distance && (
            <Badge variant="neutral" className="gap-1">
              <MapPin className="h-3 w-3" /> {hotel.distance}
            </Badge>
          )}
        </div>

        {/* Divider + price + CTA */}
        <div className="border-border flex items-center justify-between border-t pt-4">
          <div>
            {hotel.pricePerNight != null ? (
              <>
                <span className="text-muted-foreground block text-[10px] font-bold tracking-widest uppercase">
                  From
                </span>
                <span className="font-display text-foreground text-2xl font-extrabold">
                  &euro;{hotel.pricePerNight}
                  <span className="text-muted-foreground text-sm font-normal">/night</span>
                </span>
              </>
            ) : (
              <span className="text-muted-foreground text-sm">Price unavailable</span>
            )}
          </div>
          <a
            href={hotel.bookingUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-primary hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all active:scale-95"
          >
            Book Now
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

/** Find the most recent hotel booking click matching a city */
function findClickForCity(
  clicks: BookingClick[] | undefined,
  city: string
): BookingClick | undefined {
  if (!clicks) return undefined;
  return clicks.find((c) => {
    if (c.clickType !== "hotel") return false;
    // Match by metadata.city or top-level city field
    if (c.metadata) {
      const m = c.metadata as BookingClickMetadata;
      if (m.type === "hotel" && m.city?.toLowerCase() === city.toLowerCase()) return true;
    }
    return c.city?.toLowerCase() === city.toLowerCase();
  });
}

/* ─── Booking Confirmation Prompt ─── */
function HotelBookingConfirmation({
  click,
  city,
  onConfirm,
}: {
  click: BookingClick;
  city: string;
  onConfirm: (clickId: string, confirmed: boolean) => void;
}) {
  if (click.bookingConfirmed === true) {
    return (
      <div className="dark:bg-card flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm">
        <div className="bg-app-green/10 flex h-5 w-5 items-center justify-center rounded-full">
          <Check className="text-app-green h-3 w-3" />
        </div>
        <p className="text-muted-foreground text-xs font-medium">Hotel booked in {city}</p>
      </div>
    );
  }

  if (click.bookingConfirmed !== null) return null;

  return (
    <div className="dark:bg-card flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
      <Hotel className="text-primary h-4 w-4 shrink-0" />
      <p className="text-foreground flex-1 text-xs font-medium">Did you book a hotel in {city}?</p>
      <button
        onClick={() => onConfirm(click.id, true)}
        className="bg-app-green/10 text-app-green hover:bg-app-green/20 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
        aria-label={`Yes, I booked a hotel in ${city}`}
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onConfirm(click.id, false)}
        className="bg-app-red/10 text-app-red hover:bg-app-red/20 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
        aria-label={`No, I did not book a hotel in ${city}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─── Main AccommodationTab ─── */
export function AccommodationTab({ itinerary, tripId }: AccommodationTabProps) {
  const { accommodationLoading, accommodationError } = useTripContext();
  const accommodationData = itinerary.accommodationData;
  const route = itinerary.route;

  const isAuthenticated = useAuthStatus();
  const { data: bookingClicks } = useBookingClicks(tripId, { enabled: isAuthenticated === true });
  const confirmMutation = useConfirmBooking();
  const handleConfirmBooking = useCallback(
    (clickId: string, confirmed: boolean) => {
      confirmMutation.mutate({ tripId, clickId, confirmed });
    },
    [confirmMutation, tripId]
  );

  const dateStart = useTripStore((s) => s.dateStart);
  const travelers = useTripStore((s) => s.travelers) || 1;
  const travelerPreferences = useTravelerPreferences({ includeTransientFallback: true });
  const travelStyle = travelerPreferences.data?.travelStyle ?? "smart-budget";
  const setItinerary = useTripStore((s) => s.setItinerary);
  const queryClient = useQueryClient();

  const [refetching, setRefetching] = useState(false);
  const handleRefetch = useCallback(async () => {
    if (!dateStart) return;
    setRefetching(true);
    try {
      const queryKey = getAccommodationQueryKey(route, dateStart, travelers, travelStyle);
      const data = await queryClient.fetchQuery({
        queryKey,
        queryFn: ({ signal }) =>
          fetchAccommodationEnrichment(route, dateStart, travelers, travelStyle, signal),
        staleTime: 0,
      });

      const current = useTripStore.getState().itinerary;
      if (current) {
        setItinerary({
          ...current,
          accommodationData: data as CityAccommodation[],
        });
      }
    } catch {
      // Errors surface via the accommodationError context flag
    } finally {
      setRefetching(false);
    }
  }, [dateStart, queryClient, route, setItinerary, travelers, travelStyle]);

  /* ─── Loading state ─── */
  if (accommodationLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-foreground text-xl font-bold tracking-tight">
            Accommodation
          </h2>
          <Badge variant="brand" className="gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" /> Finding hotels
          </Badge>
        </div>
        <div className="space-y-6">
          {route.map((stop) => (
            <div key={stop.id} className="space-y-3">
              <CityHeader city={stop.city} />
              <SkeletonHotelCard />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ─── Error state ─── */
  if (accommodationError) {
    return (
      <div className="space-y-6">
        <SectionHeader refetching={refetching} onRefetch={handleRefetch} />
        <AlertBox
          variant="warning"
          title="Could not load hotel recommendations"
          description="The hotel search service returned an error. You can still browse options using the links below."
        />
        <FallbackCards route={route} accommodationData={accommodationData} />
      </div>
    );
  }

  /* ─── Empty / no data state ─── */
  if (!accommodationData || accommodationData.length === 0) {
    const hasNoHotels = accommodationData && accommodationData.every((a) => a.hotels.length === 0);

    return (
      <div className="space-y-6">
        <SectionHeader refetching={refetching} onRefetch={handleRefetch} />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Hotel className="text-primary/20 mb-4 h-12 w-12" />
          <p className="font-display text-foreground text-lg font-bold">
            {hasNoHotels ? "Hotel search unavailable" : "No hotel data yet"}
          </p>
          <p className="text-muted-foreground mt-1 max-w-xs text-sm">
            {hasNoHotels
              ? "Live hotel prices require the search API. Browse options below."
              : "Accommodation suggestions will appear once your itinerary is fully generated."}
          </p>
        </div>
        <FallbackCards route={route} accommodationData={accommodationData} />
      </div>
    );
  }

  /* ─── Success state ─── */
  return (
    <div className="space-y-6">
      <SectionHeader refetching={refetching} onRefetch={handleRefetch} />

      {accommodationData.map((cityAccom, i) => (
        <motion.div
          key={cityAccom.city}
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ delay: i * 0.05 }}
          className="space-y-4"
        >
          {/* City header with context pills */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="bg-surface-soft text-foreground inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm">
              <MapPin className="text-primary h-3 w-3" />
              {cityAccom.city}
            </span>
            <span className="bg-surface-soft text-foreground inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm">
              {formatDate(cityAccom.checkIn)} — {formatDate(cityAccom.checkOut)}
            </span>
            <Badge variant="neutral">
              {cityAccom.hotels.length} hotel{cityAccom.hotels.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          {/* Booking confirmation prompt */}
          {(() => {
            const click = findClickForCity(bookingClicks, cityAccom.city);
            return click ? (
              <HotelBookingConfirmation
                click={click}
                city={cityAccom.city}
                onConfirm={handleConfirmBooking}
              />
            ) : null;
          })()}

          {/* Hotel cards */}
          {cityAccom.hotels.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {cityAccom.hotels.map((hotel) => (
                <HotelCard key={hotel.hotelId} hotel={hotel} />
              ))}
            </div>
          ) : (
            <FallbackSearchLink city={cityAccom.city} url={cityAccom.fallbackSearchUrl} />
          )}
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Shared sub-components ─── */

function SectionHeader({ refetching, onRefetch }: { refetching: boolean; onRefetch: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-display text-foreground text-xl font-bold tracking-tight">
        Accommodation
      </h2>
      <button
        onClick={onRefetch}
        disabled={refetching}
        className="text-muted-foreground hover:text-primary hover:bg-surface-soft rounded-full p-2 transition-colors disabled:opacity-50"
        title="Refresh hotel data"
      >
        <RefreshCw className={`h-4 w-4 ${refetching ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}

function CityHeader({ city }: { city: string }) {
  return (
    <span className="bg-surface-soft text-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm">
      <MapPin className="text-primary h-3 w-3" />
      {city}
    </span>
  );
}

function FallbackSearchLink({ city, url }: { city: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-surface-soft hover:bg-surface-hover group flex items-center gap-3 rounded-xl p-5 transition-all"
    >
      <Search className="text-primary/30 h-8 w-8 flex-shrink-0" />
      <div>
        <p className="text-foreground text-sm font-semibold">Search hotels in {city}</p>
        <p className="text-muted-foreground group-hover:text-primary mt-0.5 text-xs transition-colors">
          Browse available options on Booking.com &rarr;
        </p>
      </div>
    </a>
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
          <FallbackSearchLink
            key={stop.id}
            city={stop.city}
            url={
              fallbackUrl ??
              `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(stop.city)}`
            }
          />
        );
      })}
    </div>
  );
}
