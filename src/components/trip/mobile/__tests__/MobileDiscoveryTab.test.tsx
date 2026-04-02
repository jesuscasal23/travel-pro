import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockFramerMotion } from "@/__tests__/mocks";
import type { ActivityDiscoveryCandidate } from "@/types";
import { MobileDiscoveryTab } from "../MobileDiscoveryTab";

vi.mock("framer-motion", () => {
  const motion = mockFramerMotion();
  return {
    ...motion,
    useMotionValue: vi.fn(() => 0),
    useTransform: vi.fn(() => 0),
  };
});

function makeCard(overrides: Partial<ActivityDiscoveryCandidate> = {}): ActivityDiscoveryCandidate {
  return {
    name: "Tsukiji Market",
    placeName: "Tsukiji Market",
    venueType: "Market",
    description: "Food and local culture.",
    highlights: ["Fresh seafood"],
    category: "Food",
    duration: "2h",
    googleMapsUrl: "https://maps.google.com/?q=Tsukiji",
    imageUrl: null,
    imageUrls: [],
    lat: 35.665,
    lng: 139.77,
    ...overrides,
  };
}

function renderSubject(props: Partial<React.ComponentProps<typeof MobileDiscoveryTab>> = {}) {
  return render(
    <MobileDiscoveryTab
      status="pending"
      cards={[]}
      cursor={0}
      totalTarget={0}
      isLoading={false}
      error={null}
      isMultiCity={false}
      onSwipe={vi.fn()}
      cityIndex={0}
      totalCities={1}
      likedCount={0}
      requiredCount={0}
      currentCityName="Tokyo"
      roundLimitReached={false}
      {...props}
    />
  );
}

describe("MobileDiscoveryTab", () => {
  it("shows the loading state instead of completion when no cards have loaded yet", () => {
    renderSubject({ isLoading: true });

    expect(screen.getByText(/Generating activity cards/i)).toBeInTheDocument();
    expect(screen.queryByText(/Discovery Complete/i)).not.toBeInTheDocument();
  });

  it("shows the empty/error state instead of completion when discovery produced no cards", () => {
    renderSubject({ error: "We couldn't load activity cards for this city. Please try again." });

    expect(screen.getByText(/No activity cards available yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/We couldn't load activity cards for this city\. Please try again\./i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Discovery Complete/i)).not.toBeInTheDocument();
  });

  it("still shows completion after the last loaded card has been swiped", () => {
    renderSubject({
      status: "in_progress",
      cards: [makeCard()],
      cursor: 1,
      totalTarget: 1,
    });

    expect(screen.getByText(/Discovery Complete/i)).toBeInTheDocument();
    expect(screen.getByText(/Thank you/i)).toBeInTheDocument();
  });

  it("renders the dual-photo collage layout when two photos are available", () => {
    const card = makeCard({
      imageUrl: "https://example.com/primary.jpg",
      imageUrls: ["https://example.com/primary.jpg", "https://example.com/secondary.jpg"],
    });

    renderSubject({
      status: "in_progress",
      cards: [card],
      cursor: 0,
      totalTarget: 1,
    });

    expect(screen.getByAltText(/alternate view/i)).toBeInTheDocument();
  });
});
