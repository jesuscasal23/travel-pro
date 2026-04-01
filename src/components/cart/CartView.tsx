"use client";

import { useCallback, useEffect, useState } from "react";
import { Plane, Sparkles, Wallet } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/hooks/api/selections/useCart";
import { useMarkSelectionBooked } from "@/hooks/api/selections/useMarkSelectionBooked";
import { useRemoveSelection } from "@/hooks/api/selections/useRemoveSelection";
import { AppScreen } from "@/components/ui/AppScreen";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { CartTripGroup } from "./CartTripGroup";
import type { FlightSelection, HotelSelection } from "@/types";

function buildFlightBookUrl(selection: FlightSelection): string {
  if (selection.bookingToken) {
    const params = new URLSearchParams({
      token: selection.bookingToken,
      dep: selection.fromIata,
      arr: selection.toIata,
      date: selection.departureDate,
    });
    return `/api/v1/flights/book?${params}`;
  }
  return selection.bookingUrl;
}

export function CartView() {
  const { data: trips, isLoading } = useCart();
  const markBookedMutation = useMarkSelectionBooked();
  const removeMutation = useRemoveSelection();

  // Track which items are awaiting "Did you book?" confirmation
  const [awaitingIds, setAwaitingIds] = useState<Set<string>>(new Set());

  // On window re-focus, show confirmation prompt for any items that were clicked
  useEffect(() => {
    function handleFocus() {
      // awaitingIds already set by onBookFlight/onBookHotel
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handleBookFlight = useCallback((selection: FlightSelection) => {
    const url = buildFlightBookUrl(selection);
    window.open(url, "_blank");
    setAwaitingIds((prev) => new Set(prev).add(selection.id));
  }, []);

  const handleBookHotel = useCallback((selection: HotelSelection) => {
    window.open(selection.bookingUrl, "_blank");
    setAwaitingIds((prev) => new Set(prev).add(selection.id));
  }, []);

  const handleMarkBooked = useCallback(
    (selectionId: string, type: "flights" | "hotels", tripId: string, booked: boolean = true) => {
      markBookedMutation.mutate({ tripId, selectionId, type, booked });
      setAwaitingIds((prev) => {
        const next = new Set(prev);
        next.delete(selectionId);
        return next;
      });
    },
    [markBookedMutation]
  );

  const handleRemove = useCallback(
    (selectionId: string, type: "flights" | "hotels", tripId: string) => {
      removeMutation.mutate({ tripId, selectionId, type });
      setAwaitingIds((prev) => {
        const next = new Set(prev);
        next.delete(selectionId);
        return next;
      });
    },
    [removeMutation]
  );

  const handleConfirmBooking = useCallback(
    (selectionId: string, confirmed: boolean, type: "flights" | "hotels", tripId: string) => {
      if (confirmed) {
        markBookedMutation.mutate({ tripId, selectionId, type });
      }
      setAwaitingIds((prev) => {
        const next = new Set(prev);
        next.delete(selectionId);
        return next;
      });
    },
    [markBookedMutation]
  );

  const totalItems = trips?.reduce((sum, t) => sum + t.flights.length + t.hotels.length, 0) ?? 0;

  return (
    <AppScreen>
      <PageHeader
        title="Wallet"
        description="Quick access to flights and stays you still need to book or already confirmed."
        titleBadge={totalItems > 0 ? <Badge variant="brand">{totalItems}</Badge> : undefined}
      />

      <div className="px-6">
        {/* Price disclaimer */}
        {totalItems > 0 && (
          <p className="text-muted-foreground mb-4 text-[11px]">
            Prices shown are from when you selected. Actual prices may differ at booking time.
          </p>
        )}

        {isLoading ? (
          /* Loading skeleton */
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="bg-secondary h-8 w-48 rounded-full" />
                <div className="dark:bg-card rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex gap-3">
                    <div className="bg-secondary h-9 w-9 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="bg-secondary h-4 w-32 rounded" />
                      <div className="bg-secondary h-3 w-24 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !trips || trips.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Wallet className="text-primary/20 mb-4 h-14 w-14" />
            <p className="font-display text-foreground text-lg font-bold">Your wallet is empty</p>
            <p className="text-muted-foreground mt-2 max-w-xs text-sm">
              Browse flights and hotels on your trip pages to start adding selections.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                href="/trips"
                className="bg-primary hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all"
              >
                <Plane className="h-4 w-4" /> Browse trips
              </Link>
              <Link
                href="/plan"
                className="bg-surface-soft hover:bg-surface-hover text-foreground inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold shadow-sm transition-all"
              >
                <Sparkles className="h-4 w-4" /> Create a trip
              </Link>
            </div>
          </div>
        ) : (
          /* Wallet items grouped by trip */
          <div className="space-y-8">
            {trips.map((trip) => (
              <CartTripGroup
                key={trip.tripId}
                trip={trip}
                awaitingIds={awaitingIds}
                onBookFlight={handleBookFlight}
                onBookHotel={handleBookHotel}
                onMarkBooked={handleMarkBooked}
                onRemove={handleRemove}
                onConfirmBooking={handleConfirmBooking}
              />
            ))}
          </div>
        )}
      </div>
    </AppScreen>
  );
}
