"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Check,
  ChevronDown,
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
import { useHotelSelections } from "@/hooks/api/selections/useHotelSelections";
import { useUpsertHotelSelection } from "@/hooks/api/selections/useUpsertHotelSelection";
import { useRemoveSelection } from "@/hooks/api/selections/useRemoveSelection";
import { Badge } from "@/components/ui/Badge";
import { AlertBox } from "@/components/ui/AlertBox";
import { useTripContext } from "../TripContext";
import type {
  Itinerary,
  CityAccommodation,
  CityHotel,
  BookingClick,
  BookingClickMetadata,
  HotelSelection,
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

/* ─── Individual Hotel Card ─── */
function HotelCard({
  hotel,
  isSelected,
  onSelect,
  onRemove,
}: {
  hotel: CityHotel;
  isSelected?: boolean;
  onSelect?: (hotel: CityHotel) => void;
  onRemove?: () => void;
}) {
  return (
    <div
      className={`bg-card overflow-hidden rounded-xl transition-shadow ${
        isSelected ? "ring-app-green/30 shadow-card ring-2" : "shadow-card hover:shadow-card-hover"
      }`}
    >
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
        {isSelected && (
          <div className="absolute top-3 right-3">
            <span className="bg-app-green inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-sm">
              <Check className="h-3 w-3" /> Selected
            </span>
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
          {isSelected ? (
            <div className="flex items-center gap-3">
              {onRemove && (
                <button
                  onClick={onRemove}
                  className="text-muted-foreground hover:text-app-red text-xs font-medium transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          ) : onSelect ? (
            <button
              onClick={() => onSelect(hotel)}
              className="bg-primary hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all active:scale-95"
            >
              Select
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <a
              href={hotel.bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-primary hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all active:scale-95"
            >
              Book Now
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          )}
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

/* ─── City hotel section with selection/collapse ─── */
function CityHotelSection({
  cityAccom,
  selection,
  bookingClick,
  onSelectHotel,
  onRemoveSelection,
  onConfirmBooking,
  onSelectManual,
}: {
  cityAccom: CityAccommodation;
  selection?: HotelSelection;
  bookingClick?: BookingClick;
  onSelectHotel: (hotel: CityHotel) => void;
  onRemoveSelection?: () => void;
  onConfirmBooking: (clickId: string, confirmed: boolean) => void;
  onSelectManual?: () => void;
}) {
  const [showOthers, setShowOthers] = useState(false);

  const selectedHotel = selection
    ? cityAccom.hotels.find((h) => h.hotelId === selection.hotelId)
    : undefined;
  const otherHotels = selection
    ? cityAccom.hotels.filter((h) => h.hotelId !== selection.hotelId)
    : cityAccom.hotels;

  return (
    <div className="space-y-4">
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
      {bookingClick && (
        <HotelBookingConfirmation
          click={bookingClick}
          city={cityAccom.city}
          onConfirm={onConfirmBooking}
        />
      )}

      {/* Hotel cards */}
      {cityAccom.hotels.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {/* Show selected hotel first */}
          {selectedHotel && (
            <HotelCard hotel={selectedHotel} isSelected onRemove={onRemoveSelection} />
          )}

          {/* If selection exists, show others behind a toggle */}
          {selection && otherHotels.length > 0 && (
            <>
              {!showOthers ? (
                <button
                  onClick={() => setShowOthers(true)}
                  className="text-primary hover:bg-surface-soft flex items-center justify-center gap-2 rounded-xl p-3 text-sm font-medium transition-colors"
                >
                  <ChevronDown className="h-4 w-4" />
                  View {otherHotels.length} other option{otherHotels.length !== 1 ? "s" : ""}
                </button>
              ) : (
                otherHotels.map((hotel) => (
                  <HotelCard key={hotel.hotelId} hotel={hotel} onSelect={onSelectHotel} />
                ))
              )}
            </>
          )}

          {/* If no selection, show all hotels */}
          {!selection &&
            cityAccom.hotels.map((hotel) => (
              <HotelCard key={hotel.hotelId} hotel={hotel} onSelect={onSelectHotel} />
            ))}

          {/* Manual selection not included in the current hotel selections? Show it */}
          {selection && selection.selectionType === "manual" && !selectedHotel && (
            <div className="ring-app-green/30 dark:bg-card rounded-xl bg-white p-4 shadow-sm ring-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground text-sm font-semibold">{selection.hotelName}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">Booked via Booking.com</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-app-green/10 text-app-green inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold">
                    <Check className="h-3 w-3" /> Selected
                  </span>
                  {onRemoveSelection && (
                    <button
                      onClick={onRemoveSelection}
                      className="text-muted-foreground hover:text-app-red text-xs font-medium transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <FallbackSearchLink
          city={cityAccom.city}
          url={cityAccom.fallbackSearchUrl}
          onClickManual={onSelectManual}
        />
      )}
    </div>
  );
}

/* ─── Main AccommodationTab ─── */
export function AccommodationTab({ itinerary, tripId }: AccommodationTabProps) {
  const { accommodationLoading, accommodationError, dateStart, travelers, onAccommodationLoaded } =
    useTripContext();
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

  // Selection hooks
  const { data: hotelSelections } = useHotelSelections(tripId, {
    enabled: isAuthenticated === true,
  });
  const upsertMutation = useUpsertHotelSelection();
  const removeMutation = useRemoveSelection();

  const travelerPreferences = useTravelerPreferences({ includeTransientFallback: true });
  const travelStyle = travelerPreferences.data?.travelStyle ?? "smart-budget";
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
      onAccommodationLoaded(data as CityAccommodation[]);
    } catch {
      // Errors surface via the accommodationError context flag
    } finally {
      setRefetching(false);
    }
  }, [dateStart, queryClient, route, onAccommodationLoaded, travelers, travelStyle]);

  const handleSelectHotel = useCallback(
    (cityAccom: CityAccommodation, hotel: CityHotel) => {
      upsertMutation.mutate({
        tripId,
        body: {
          selectionType: "platform",
          city: cityAccom.city,
          countryCode: cityAccom.countryCode || "",
          checkIn: cityAccom.checkIn,
          checkOut: cityAccom.checkOut,
          hotelName: hotel.name,
          hotelId: hotel.hotelId,
          rating: hotel.rating ?? null,
          pricePerNight: hotel.pricePerNight ?? null,
          totalPrice: hotel.totalPrice ?? null,
          currency: "EUR",
          address: hotel.address ?? null,
          imageUrl: hotel.imageUrl ?? null,
          bookingUrl: hotel.bookingUrl,
        },
      });
    },
    [upsertMutation, tripId]
  );

  const handleSelectManual = useCallback(
    (cityAccom: CityAccommodation) => {
      const fallbackUrl =
        cityAccom.fallbackSearchUrl ||
        `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(cityAccom.city)}`;
      upsertMutation.mutate({
        tripId,
        body: {
          selectionType: "manual",
          city: cityAccom.city,
          countryCode: cityAccom.countryCode || "",
          checkIn: cityAccom.checkIn,
          checkOut: cityAccom.checkOut,
          hotelName: "Booking.com",
          hotelId: "manual-booking",
          bookingUrl: fallbackUrl,
        },
      });
    },
    [upsertMutation, tripId]
  );

  const handleRemoveSelection = useCallback(
    (selectionId: string) => {
      removeMutation.mutate({ tripId, selectionId, type: "hotels" });
    },
    [removeMutation, tripId]
  );

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

      {accommodationData.map((cityAccom, i) => {
        const click = findClickForCity(bookingClicks, cityAccom.city);
        const selection = hotelSelections?.find(
          (s) => s.city === cityAccom.city && s.checkIn === cityAccom.checkIn
        );

        return (
          <motion.div
            key={cityAccom.city}
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ delay: i * 0.05 }}
          >
            <CityHotelSection
              cityAccom={cityAccom}
              selection={selection}
              bookingClick={click}
              onSelectHotel={(hotel) => handleSelectHotel(cityAccom, hotel)}
              onRemoveSelection={selection ? () => handleRemoveSelection(selection.id) : undefined}
              onConfirmBooking={handleConfirmBooking}
              onSelectManual={() => handleSelectManual(cityAccom)}
            />
          </motion.div>
        );
      })}
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

function FallbackSearchLink({
  city,
  url,
  onClickManual,
}: {
  city: string;
  url: string;
  onClickManual?: () => void;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onClickManual?.()}
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
