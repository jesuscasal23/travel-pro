import type { CartTripCostSummary, CartTripSlots, FlightSelection, HotelSelection } from "@/types";

function pickOutboundFlight(flights: FlightSelection[]): FlightSelection | null {
  const outbound = flights.find((f) => f.direction === "outbound");
  if (outbound) return outbound;
  return flights.length > 0 ? flights[0] : null;
}

function pickReturnFlight(flights: FlightSelection[]): FlightSelection | null {
  const returning = flights.find((f) => f.direction === "return");
  if (returning) return returning;
  return flights.length > 1 ? flights[flights.length - 1] : null;
}

function pickPrimaryHotel(hotels: HotelSelection[]): HotelSelection | null {
  if (hotels.length === 0) return null;
  return [...hotels].sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0];
}

export function deriveCartSlots(
  flights: FlightSelection[],
  hotels: HotelSelection[]
): CartTripSlots {
  return {
    outboundFlight: pickOutboundFlight(flights),
    returnFlight: pickReturnFlight(flights),
    primaryHotel: pickPrimaryHotel(hotels),
  };
}

function accumulateFlightPrice(selection: FlightSelection): number {
  return Number.isFinite(selection.price) ? selection.price : 0;
}

function accumulateHotelPrice(selection: HotelSelection): number {
  return selection.totalPrice != null ? selection.totalPrice : 0;
}

export function deriveCartCostSummary(
  flights: FlightSelection[],
  hotels: HotelSelection[]
): CartTripCostSummary {
  return [...flights, ...hotels].reduce<CartTripCostSummary>(
    (acc, selection) => {
      const price =
        "totalPrice" in selection
          ? accumulateHotelPrice(selection as HotelSelection)
          : accumulateFlightPrice(selection as FlightSelection);
      if (price <= 0) return acc;
      if (selection.booked) {
        acc.bookedTotal += price;
      } else {
        acc.pendingTotal += price;
      }
      return acc;
    },
    { bookedTotal: 0, pendingTotal: 0 }
  );
}
