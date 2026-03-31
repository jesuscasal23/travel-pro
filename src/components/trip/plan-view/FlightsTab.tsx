"use client";

import { useMemo, useCallback } from "react";
import { Plane, Loader2 } from "lucide-react";
import { FlightOptionsPanel } from "@/components/trip/FlightOptionsPanel";
import { Badge } from "@/components/ui/Badge";
import { useTravelerPreferences } from "@/hooks/api";
import { useBatchFlightSearch } from "@/hooks/api/flights/useFlightSearch";
import { useAuthStatus } from "@/hooks/api/auth/useAuthStatus";
import { useBookingClicks } from "@/hooks/api/booking-clicks/useBookingClicks";
import { useConfirmBooking } from "@/hooks/api/booking-clicks/useConfirmBooking";
import { useFlightSelections } from "@/hooks/api/selections/useFlightSelections";
import { useUpsertFlightSelection } from "@/hooks/api/selections/useUpsertFlightSelection";
import { useRemoveSelection } from "@/hooks/api/selections/useRemoveSelection";
import { useTripContext } from "@/components/trip/TripContext";
import { extractHomeAirportIata } from "@/lib/features/profile/traveler-preferences";
import { buildTrackedLink } from "@/lib/features/affiliate/link-generator";
import type { Itinerary, BookingClick, BookingClickMetadata, FlightDirection } from "@/types";
import type { FlightSearchResult, FlightLegResults } from "@/lib/flights/types";

interface FlightLegWithDirection extends FlightLegResults {
  direction: FlightDirection;
}

interface FlightsTabProps {
  itinerary: Itinerary;
  tripId: string;
}

/** Add N days to a YYYY-MM-DD date string */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Find the most recent flight booking click matching a leg's IATA pair */
function findClickForLeg(
  clicks: BookingClick[] | undefined,
  fromIata: string,
  toIata: string
): BookingClick | undefined {
  if (!clicks) return undefined;
  return clicks.find((c) => {
    if (c.clickType !== "flight" || !c.metadata) return false;
    const m = c.metadata as BookingClickMetadata;
    return m.type === "flight" && m.fromIata === fromIata && m.toIata === toIata;
  });
}

export function FlightsTab({ itinerary, tripId }: FlightsTabProps) {
  const travelerPreferences = useTravelerPreferences({ includeTransientFallback: true });
  const homeAirport = travelerPreferences.data?.homeAirport ?? "";
  const { dateStart } = useTripContext();

  const { tripDirection } = useTripContext();
  const { route, flightOptions, flightLegs } = itinerary;
  const homeIata = extractHomeAirportIata(homeAirport);
  const isOneWay = tripDirection === "one-way";

  const isAuthenticated = useAuthStatus();
  const { data: bookingClicks } = useBookingClicks(tripId, { enabled: isAuthenticated === true });
  const confirmMutation = useConfirmBooking();

  // Selection hooks
  const { data: flightSelections } = useFlightSelections(tripId, {
    enabled: isAuthenticated === true,
  });
  const upsertMutation = useUpsertFlightSelection();
  const removeMutation = useRemoveSelection();

  const handleConfirmBooking = useCallback(
    (clickId: string, confirmed: boolean) => {
      confirmMutation.mutate({ tripId, clickId, confirmed });
    },
    [confirmMutation, tripId]
  );

  // Build FlightLegWithDirection[] from whatever data is available
  const legs: FlightLegWithDirection[] = useMemo(() => {
    // If we already have multi-result flight options, tag them with direction
    if (flightOptions && flightOptions.length > 0) {
      const tagged = flightOptions.map((leg, i) => ({
        ...leg,
        direction: (i === 0
          ? "outbound"
          : i === flightOptions.length - 1
            ? "return"
            : "internal") as FlightDirection,
      }));
      return isOneWay ? tagged.filter((l) => l.direction !== "return") : tagged;
    }

    // Otherwise derive legs from route + flightLegs or just the route
    const derived: FlightLegWithDirection[] = [];
    let runningDate = dateStart;

    // Outbound: home -> first city
    if (homeIata && route.length > 0 && route[0].iataCode) {
      const depDate = runningDate || "";
      const existing = flightLegs?.find(
        (l) => l.fromIata === homeIata && l.toIata === route[0].iataCode
      );
      derived.push({
        fromIata: homeIata,
        toIata: route[0].iataCode!,
        departureDate: existing?.departureDate || depDate,
        direction: "outbound",
        results: existing
          ? [
              {
                price: existing.price,
                duration: existing.duration,
                airline: existing.airline,
                stops: existing.stops ?? 0,
                departureTime: existing.departureTime ?? "",
                arrivalTime: existing.arrivalTime ?? "",
                cabin: "ECONOMY",
                bookingUrl: "",
              },
            ]
          : [],
        fetchedAt: 0,
      });
    }

    // Inter-city legs
    for (let i = 0; i < route.length - 1; i++) {
      const from = route[i];
      const to = route[i + 1];
      if (!from.iataCode || !to.iataCode) continue;

      if (runningDate) runningDate = addDays(runningDate, from.days);

      const existing = flightLegs?.find(
        (l) => l.fromIata === from.iataCode && l.toIata === to.iataCode
      );
      derived.push({
        fromIata: from.iataCode,
        toIata: to.iataCode,
        departureDate: existing?.departureDate || runningDate || "",
        direction: "internal",
        results: existing
          ? [
              {
                price: existing.price,
                duration: existing.duration,
                airline: existing.airline,
                stops: existing.stops ?? 0,
                departureTime: existing.departureTime ?? "",
                arrivalTime: existing.arrivalTime ?? "",
                cabin: "ECONOMY",
                bookingUrl: "",
              },
            ]
          : [],
        fetchedAt: 0,
      });
    }

    // Return: last city -> home (skip for one-way trips)
    if (!isOneWay && homeIata && route.length > 0 && route[route.length - 1].iataCode) {
      const lastCity = route[route.length - 1];
      if (runningDate) runningDate = addDays(runningDate, lastCity.days);

      const existing = flightLegs?.find(
        (l) => l.fromIata === lastCity.iataCode && l.toIata === homeIata
      );
      derived.push({
        fromIata: lastCity.iataCode!,
        toIata: homeIata,
        departureDate: existing?.departureDate || runningDate || "",
        direction: "return",
        results: existing
          ? [
              {
                price: existing.price,
                duration: existing.duration,
                airline: existing.airline,
                stops: existing.stops ?? 0,
                departureTime: existing.departureTime ?? "",
                arrivalTime: existing.arrivalTime ?? "",
                cabin: "ECONOMY",
                bookingUrl: "",
              },
            ]
          : [],
        fetchedAt: 0,
      });
    }

    return derived;
  }, [route, flightOptions, flightLegs, homeIata, dateStart, isOneWay]);

  // Auto-fetch legs that have no results OR only have placeholder results without booking tokens
  const hasLegsToFetch = legs.some(
    (l) => l.departureDate && (l.results.length === 0 || l.results.every((r) => !r.bookingToken))
  );
  const { getResultsForLeg, isLoading: batchLoading } = useBatchFlightSearch(
    tripId,
    legs,
    1,
    hasLegsToFetch
  );

  if (legs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Plane className="text-primary/20 mb-4 h-12 w-12" />
        <p className="font-display text-foreground text-lg font-bold">No flight legs available</p>
        <p className="text-muted-foreground mt-1 max-w-xs text-sm">
          {!homeAirport
            ? "Set your home airport in your profile to see flight options."
            : "Flight information will appear once your itinerary has cities with airport codes."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-foreground text-xl font-bold tracking-tight">
            Flight Options
          </h2>
          {batchLoading && (
            <Badge variant="brand" className="gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> Searching
            </Badge>
          )}
        </div>
        <Badge variant="neutral">
          {legs.length} leg{legs.length !== 1 ? "s" : ""}
        </Badge>
      </div>
      {legs.map((leg, i) => {
        const batch = getResultsForLeg(leg.fromIata, leg.toIata, leg.departureDate);
        const click = findClickForLeg(bookingClicks, leg.fromIata, leg.toIata);
        const selection = flightSelections?.find(
          (s) =>
            s.fromIata === leg.fromIata &&
            s.toIata === leg.toIata &&
            s.departureDate === leg.departureDate
        );

        const handleSelect = (result: FlightSearchResult) => {
          const bookingUrl =
            result.bookingUrl ||
            buildTrackedLink({
              provider: "skyscanner",
              type: "flight",
              itineraryId: tripId,
              dest: `https://www.skyscanner.net/transport/flights/${leg.fromIata}/${leg.toIata}/`,
              metadata: {
                type: "flight",
                fromIata: leg.fromIata,
                toIata: leg.toIata,
                departureDate: leg.departureDate,
                direction: leg.direction,
              },
            });

          upsertMutation.mutate({
            tripId,
            body: {
              selectionType: "platform",
              fromIata: leg.fromIata,
              toIata: leg.toIata,
              departureDate: leg.departureDate,
              direction: leg.direction,
              airline: result.airline,
              price: result.price,
              duration: result.duration,
              stops: result.stops,
              departureTime: result.departureTime || null,
              arrivalTime: result.arrivalTime || null,
              cabin: result.cabin || "ECONOMY",
              bookingToken: result.bookingToken || null,
              bookingUrl,
            },
          });
        };

        const handleSelectManual = () => {
          const fallbackUrl = buildTrackedLink({
            provider: "skyscanner",
            type: "flight",
            itineraryId: tripId,
            dest: `https://www.skyscanner.net/transport/flights/${leg.fromIata}/${leg.toIata}/`,
            metadata: {
              type: "flight",
              fromIata: leg.fromIata,
              toIata: leg.toIata,
              departureDate: leg.departureDate,
              direction: leg.direction,
            },
          });

          upsertMutation.mutate({
            tripId,
            body: {
              selectionType: "manual",
              fromIata: leg.fromIata,
              toIata: leg.toIata,
              departureDate: leg.departureDate,
              direction: leg.direction,
              airline: "Skyscanner",
              price: 0,
              duration: "",
              stops: 0,
              bookingUrl: fallbackUrl,
            },
          });
        };

        const handleRemove = () => {
          if (selection) {
            removeMutation.mutate({
              tripId,
              selectionId: selection.id,
              type: "flights",
            });
          }
        };

        return (
          <FlightOptionsPanel
            key={`${leg.fromIata}-${leg.toIata}-${i}`}
            leg={leg}
            tripId={tripId}
            itineraryId={tripId}
            direction={leg.direction}
            batchResults={batch.results}
            batchLoading={batch.loading}
            batchError={batch.error}
            batchFetchedAt={batch.fetchedAt}
            bookingClick={click}
            onConfirmBooking={handleConfirmBooking}
            selectedFlight={selection}
            onSelectFlight={handleSelect}
            onSelectManual={handleSelectManual}
            onRemoveSelection={selection ? handleRemove : undefined}
          />
        );
      })}
    </div>
  );
}
