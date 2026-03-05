import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Itinerary } from "@/types";
import type { EditItinerary } from "@/stores/useEditStore";

const mocks = vi.hoisted(() => ({
  editStore: {
    isEditMode: true,
    draft: null as EditItinerary | null,
    undoStack: [] as EditItinerary[],
    isRouteSheetOpen: false,
    enterEditMode: vi.fn(),
    exitEditMode: vi.fn(),
    saveAndExit: vi.fn(),
    updateDraft: vi.fn(),
    undo: vi.fn(),
    setRouteSheetOpen: vi.fn(),
  },
  tripStore: {
    setItinerary: vi.fn(),
    setNeedsRegeneration: vi.fn(),
  },
}));

vi.mock("@/stores/useEditStore", () => ({
  useEditStore: () => mocks.editStore,
}));

vi.mock("@/stores/useTripStore", () => ({
  useTripStore: (
    selector?: (s: {
      setItinerary: typeof mocks.tripStore.setItinerary;
      setNeedsRegeneration: typeof mocks.tripStore.setNeedsRegeneration;
    }) => unknown
  ) => {
    if (!selector) return mocks.tripStore;
    return selector(mocks.tripStore);
  },
}));

vi.mock("next/dynamic", () => ({
  default: () => () => <div data-testid="route-map" />,
}));

vi.mock("@/components/Navbar", () => ({
  Navbar: () => <div data-testid="navbar" />,
}));

vi.mock("../DesktopHero", () => ({
  DesktopHero: () => <div data-testid="desktop-hero" />,
}));

vi.mock("../DesktopTabBar", () => ({
  DesktopTabBar: () => <div data-testid="desktop-tab-bar" />,
}));

vi.mock("../DesktopJourneyTab", () => ({
  DesktopJourneyTab: () => <div data-testid="desktop-journey-tab" />,
}));

vi.mock("../../plan-view/EssentialsTab", () => ({
  EssentialsTab: () => <div data-testid="essentials-tab" />,
}));

vi.mock("../../SkeletonTabs", () => ({
  ItinerarySkeletonTab: () => <div data-testid="itinerary-skeleton-tab" />,
}));

vi.mock("../../edit/EditModeBanner", () => ({
  EditModeBanner: () => <div data-testid="edit-mode-banner" />,
}));

vi.mock("../../edit/EditToolbar", () => ({
  EditToolbar: () => <div data-testid="edit-toolbar" />,
}));

vi.mock("../../edit/EditRouteSheet", () => ({
  EditRouteSheet: () => <div data-testid="edit-route-sheet" />,
}));

vi.mock("../../edit/EditModeJourneyContent", () => ({
  EditModeJourneyContent: () => <div data-testid="edit-journey-content" />,
}));

vi.mock("../../ShareModal", () => ({
  ShareModal: () => <div data-testid="share-modal" />,
}));

vi.mock("@/hooks/api", () => ({
  useShareTrip: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import { DesktopLayout } from "../DesktopLayout";

function makeItinerary(): Itinerary {
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
        activities: [{ name: "Louvre", category: "Culture", why: "Art", duration: "2h" }],
      },
    ],
  };
}

describe("DesktopLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.editStore.isEditMode = true;
    mocks.editStore.draft = {
      ...makeItinerary(),
      days: [
        {
          day: 1,
          date: "2026-06-01",
          city: "Paris",
          activities: [
            {
              _editId: "edit-1",
              name: "Louvre",
              category: "Culture",
              why: "Art",
              duration: "2h",
            },
          ],
        },
      ],
    };
  });

  it("handles keyboard shortcuts in edit mode", () => {
    render(
      <DesktopLayout
        itinerary={makeItinerary()}
        tripId="trip-123"
        tripTitle="Paris"
        totalDays={2}
        countries={["France"]}
        isAuthenticated
        isPartialItinerary={false}
        isGenerating={false}
        generationError={null}
        needsRegeneration={false}
        onRetry={vi.fn()}
        onRegenerate={vi.fn()}
        onDismissRegeneration={vi.fn()}
        visaLoading={false}
        weatherLoading={false}
        visaError={false}
        weatherError={false}
        accommodationLoading={false}
        accommodationError={false}
        activeCityIndex={0}
        onCityClick={vi.fn()}
        generatingCityId={null}
        onGenerateActivities={vi.fn()}
      />
    );

    fireEvent.keyDown(document, { key: "z", ctrlKey: true });
    fireEvent.keyDown(document, { key: "Escape" });

    expect(mocks.editStore.undo).toHaveBeenCalledTimes(1);
    expect(mocks.editStore.exitEditMode).toHaveBeenCalledTimes(1);
  });

  it("does not run keyboard edit shortcuts when edit mode is off", () => {
    mocks.editStore.isEditMode = false;
    mocks.editStore.draft = null;

    render(
      <DesktopLayout
        itinerary={makeItinerary()}
        tripId="trip-123"
        tripTitle="Paris"
        totalDays={2}
        countries={["France"]}
        isAuthenticated
        isPartialItinerary={false}
        isGenerating={false}
        generationError={null}
        needsRegeneration={false}
        onRetry={vi.fn()}
        onRegenerate={vi.fn()}
        onDismissRegeneration={vi.fn()}
        visaLoading={false}
        weatherLoading={false}
        visaError={false}
        weatherError={false}
        accommodationLoading={false}
        accommodationError={false}
        activeCityIndex={0}
        onCityClick={vi.fn()}
        generatingCityId={null}
        onGenerateActivities={vi.fn()}
      />
    );

    fireEvent.keyDown(document, { key: "z", ctrlKey: true });
    fireEvent.keyDown(document, { key: "Escape" });

    expect(mocks.editStore.undo).not.toHaveBeenCalled();
    expect(mocks.editStore.exitEditMode).not.toHaveBeenCalled();
  });
});
