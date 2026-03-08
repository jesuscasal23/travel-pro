import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Itinerary } from "@/types";
import type { EditItinerary } from "@/stores/useEditStore";
import type { TripContextValue } from "../../TripContext";

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
  recalculateTravelDays: vi.fn((days, _route) => days),
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

vi.mock("@/lib/utils/recalculate-travel-days", () => ({
  recalculateTravelDays: (days: Itinerary["days"], route: Itinerary["route"]) =>
    mocks.recalculateTravelDays(days, route),
}));

vi.mock("../MobileHero", () => ({
  MobileHero: () => <div data-testid="mobile-hero" />,
}));

vi.mock("../MobileBottomNav", () => ({
  MobileBottomNav: () => <div data-testid="mobile-bottom-nav" />,
}));

vi.mock("../MobileJourneyTab", () => ({
  MobileJourneyTab: () => <div data-testid="mobile-journey-tab" />,
}));

vi.mock("../../plan-view/EssentialsTab", () => ({
  EssentialsTab: () => <div data-testid="essentials-tab" />,
}));

vi.mock("../../SkeletonTabs", () => ({
  ItinerarySkeletonTab: () => <div data-testid="itinerary-skeleton" />,
}));

vi.mock("../../edit/EditModeBanner", () => ({
  EditModeBanner: () => <div data-testid="edit-mode-banner" />,
}));

vi.mock("../../edit/EditToolbar", () => ({
  EditToolbar: ({ onSave }: { onSave: () => void }) => <button onClick={onSave}>Save edits</button>,
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

vi.mock("../../TripBanners", async () => {
  const { useTripContext } =
    await vi.importActual<typeof import("../../TripContext")>("../../TripContext");
  return {
    TripBanners: () => {
      const ctx = useTripContext();
      return (
        <div data-testid="trip-banners">
          {ctx.isAuthenticated === false &&
            !ctx.isPartialItinerary &&
            !ctx.generationError &&
            !ctx.needsRegeneration && <a href={`/signup?next=/trip/${ctx.tripId}`}>Save trip</a>}
        </div>
      );
    },
  };
});

vi.mock("@/hooks/api", () => ({
  useShareTrip: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import { MobileLayout } from "../MobileLayout";
import { TripProvider } from "../../TripContext";

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

function makeEditDraft(base: Itinerary): EditItinerary {
  return {
    ...base,
    days: base.days.map((day) => ({
      ...day,
      activities: day.activities.map((activity, idx) => ({
        ...activity,
        _editId: `edit-${idx + 1}`,
      })),
    })),
  };
}

function makeContextValue(overrides?: Partial<TripContextValue>): TripContextValue {
  return {
    itinerary: makeItinerary(),
    tripId: "trip-123",
    tripTitle: "Paris",
    totalDays: 2,
    countries: ["France"],
    isAuthenticated: true,
    isPartialItinerary: false,
    isGenerating: false,
    generationError: null,
    needsRegeneration: false,
    onRetry: vi.fn(),
    onRegenerate: vi.fn(),
    onDismissRegeneration: vi.fn(),
    visaLoading: false,
    weatherLoading: false,
    visaError: false,
    weatherError: false,
    accommodationLoading: false,
    accommodationError: false,
    generatingCityId: null,
    onGenerateActivities: vi.fn(),
    ...overrides,
  };
}

function renderWithContext(contextOverrides?: Partial<TripContextValue>) {
  return render(
    <TripProvider value={makeContextValue(contextOverrides)}>
      <MobileLayout />
    </TripProvider>
  );
}

describe("MobileLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.editStore.isEditMode = true;
    mocks.editStore.isRouteSheetOpen = false;
    mocks.editStore.undoStack = [{ route: [], days: [] } as unknown as EditItinerary];
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);
  });

  it("saves edited itinerary, recalculates days on route change, and persists to API", () => {
    const initial = makeItinerary();
    const edited: Itinerary = {
      ...initial,
      route: [
        ...initial.route,
        {
          id: "rome",
          city: "Rome",
          country: "Italy",
          countryCode: "IT",
          lat: 41.9,
          lng: 12.49,
          days: 2,
        },
      ],
    };
    const recalculatedDays = [
      ...initial.days,
      {
        day: 2,
        date: "2026-06-02",
        city: "Rome",
        activities: [{ name: "Colosseum", category: "Culture", why: "History", duration: "2h" }],
      },
    ];

    mocks.editStore.draft = makeEditDraft(initial);
    mocks.editStore.saveAndExit.mockImplementation((onSave: (value: Itinerary) => void) => {
      onSave(edited);
    });
    mocks.recalculateTravelDays.mockReturnValue(recalculatedDays);

    renderWithContext();

    fireEvent.click(screen.getByRole("button", { name: "Save edits" }));

    expect(mocks.recalculateTravelDays).toHaveBeenCalledWith(edited.days, edited.route);
    expect(mocks.tripStore.setItinerary).toHaveBeenCalledWith({
      ...edited,
      days: recalculatedDays,
    });
    expect(mocks.tripStore.setNeedsRegeneration).toHaveBeenCalledWith(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/trips/trip-123",
      expect.objectContaining({
        method: "PATCH",
      })
    );
  });

  it("shows guest save-trip nudge when not authenticated", () => {
    mocks.editStore.isEditMode = false;
    mocks.editStore.draft = null;
    mocks.editStore.undoStack = [];

    renderWithContext({
      tripId: "guest-trip",
      isAuthenticated: false,
    });

    const link = screen.getByRole("link", { name: "Save trip" });
    expect(link).toHaveAttribute("href", "/signup?next=/trip/guest-trip");
  });
});
