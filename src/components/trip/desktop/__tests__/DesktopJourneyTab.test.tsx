import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { Itinerary } from "@/types";
import { DesktopJourneyTab } from "../DesktopJourneyTab";

vi.mock("../../BoardingPassCard", () => ({
  BoardingPassCard: () => <div data-testid="boarding-pass" />,
}));

vi.mock("../../CityHeader", () => ({
  CityHeader: ({ city }: { city: { city: string } }) => <div>{city.city} header</div>,
}));

vi.mock("../../DayPills", () => ({
  DayPills: ({
    days,
    onDayClick,
  }: {
    days: Array<{ day: number }>;
    onDayClick: (dayNum: number) => void;
  }) => (
    <div>
      {days.map((d) => (
        <button key={d.day} onClick={() => onDayClick(d.day)}>
          day {d.day}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../../ActivityCard", () => ({
  ActivityCard: () => <div data-testid="activity-card" />,
}));

vi.mock("@/lib/utils/time-distribution", () => ({
  distributeActivities: vi.fn(() => [
    {
      activity: { name: "Louvre", category: "Culture", why: "Art", duration: "2h" },
      startMinutes: 540,
      endMinutes: 600,
      startTime: "09:00",
      endTime: "10:00",
      durationMinutes: 60,
    },
  ]),
}));

function itineraryWithActivities(): Itinerary {
  return {
    route: [
      {
        id: "paris",
        city: "Paris",
        country: "France",
        countryCode: "FR",
        lat: 48.85,
        lng: 2.35,
        days: 2,
      },
    ],
    days: [
      {
        day: 1,
        date: "2026-06-01",
        city: "Paris",
        isTravel: true,
        travelFrom: "Berlin",
        travelTo: "Paris",
        travelDuration: "2h",
        activities: [{ name: "Louvre", category: "Culture", why: "Art", duration: "2h" }],
      },
    ],
    flightLegs: [
      {
        fromCity: "Berlin",
        toCity: "Paris",
        fromIata: "BER",
        toIata: "CDG",
        departureDate: "2026-06-01",
        price: 120,
        duration: "2h",
        airline: "Airline",
      },
    ],
  };
}

function itineraryNoActivities(): Itinerary {
  return {
    route: [
      {
        id: "rome",
        city: "Rome",
        country: "Italy",
        countryCode: "IT",
        lat: 41.9,
        lng: 12.49,
        days: 3,
      },
    ],
    days: [
      {
        day: 1,
        date: "2026-06-01",
        city: "Rome",
        activities: [],
      },
    ],
  };
}

describe("DesktopJourneyTab", () => {
  it("renders activity stack and travel banner when activities exist", () => {
    render(<DesktopJourneyTab itinerary={itineraryWithActivities()} />);

    expect(screen.getByTestId("boarding-pass")).toBeInTheDocument();
    expect(screen.getByText(/Berlin\s*→\s*Paris/i)).toBeInTheDocument();
    expect(screen.getByTestId("activity-card")).toBeInTheDocument();
  });

  it("shows generation loading state for city being generated", () => {
    render(
      <DesktopJourneyTab
        itinerary={itineraryNoActivities()}
        generatingCityId="rome"
      />,
    );

    expect(
      screen.getByText(/Generating activity recommendations for Rome/i),
    ).toBeInTheDocument();
  });

  it("shows recommendation CTA and wires callback when city has no activities", () => {
    const onGenerateActivities = vi.fn();
    render(
      <DesktopJourneyTab
        itinerary={itineraryNoActivities()}
        onGenerateActivities={onGenerateActivities}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Get activity recommendations for Rome/i,
      }),
    );
    expect(onGenerateActivities).toHaveBeenCalledWith("rome", "Rome");
  });
});
