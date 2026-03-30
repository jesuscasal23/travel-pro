import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CartFlightItem } from "../CartFlightItem";
import type { FlightSelection } from "@/types";

const noop = vi.fn();

function makeSelection(overrides: Partial<FlightSelection> = {}): FlightSelection {
  return {
    id: "flight-selection-1",
    tripId: "trip-1",
    profileId: "profile-1",
    selectionType: "platform",
    fromIata: "JFK",
    toIata: "CDG",
    departureDate: "2026-07-01",
    direction: "outbound",
    airline: "AF",
    price: 245,
    duration: "2h 30m",
    stops: 0,
    departureTime: "2026-07-01T08:00:00",
    arrivalTime: "2026-07-01T10:30:00",
    cabin: "ECONOMY",
    bookingToken: "token-1",
    bookingUrl: "https://www.skyscanner.net/mock-1",
    booked: false,
    bookedAt: null,
    createdAt: "2026-03-30T00:00:00.000Z",
    updatedAt: "2026-03-30T00:00:00.000Z",
    ...overrides,
  };
}

describe("CartFlightItem", () => {
  it("shows 'Search again' for manual selections", () => {
    render(
      <CartFlightItem
        selection={makeSelection({
          selectionType: "manual",
          airline: "Skyscanner",
          price: 0,
          duration: "",
          departureTime: null,
          arrivalTime: null,
          bookingToken: null,
        })}
        onBookNow={noop}
        onMarkBooked={noop}
        onRemove={noop}
      />
    );

    expect(screen.getByText("Search again")).toBeInTheDocument();
    expect(screen.queryByText("Book Now")).not.toBeInTheDocument();
  });

  it("shows 'Book Now' for platform selections", () => {
    render(
      <CartFlightItem
        selection={makeSelection()}
        onBookNow={noop}
        onMarkBooked={noop}
        onRemove={noop}
      />
    );

    expect(screen.getByText("Book Now")).toBeInTheDocument();
    expect(screen.queryByText("Search again")).not.toBeInTheDocument();
  });
});
