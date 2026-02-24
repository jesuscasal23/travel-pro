import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { EditItinerary } from "@/stores/useEditStore";

const mocks = vi.hoisted(() => ({
  updateDraft: vi.fn(),
  expandedActivityId: null as string | null,
  setExpandedActivityId: vi.fn(),
}));

vi.mock("@/stores/useEditStore", () => ({
  useEditStore: () => ({
    updateDraft: mocks.updateDraft,
    expandedActivityId: mocks.expandedActivityId,
    setExpandedActivityId: mocks.setExpandedActivityId,
  }),
}));

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: vi.fn(),
  PointerSensor: class {},
  TouchSensor: class {},
  KeyboardSensor: class {},
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
}));

vi.mock("@dnd-kit/sortable", () => ({
  arrayMove: <T,>(arr: T[]) => arr,
  sortableKeyboardCoordinates: vi.fn(),
}));

vi.mock("../EditableActivityCard", () => ({
  EditableActivityCard: () => <div data-testid="editable-activity-card" />,
}));

vi.mock("../AddActivityButton", () => ({
  AddActivityButton: ({ onAddManual }: { onAddManual: () => void }) => (
    <button onClick={onAddManual}>Add manual activity</button>
  ),
}));

vi.mock("../DayDropZone", () => ({
  DayDropZone: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("../DayPills", () => ({
  DayPills: () => <div data-testid="day-pills" />,
}));

vi.mock("../CityHeader", () => ({
  CityHeader: () => <div data-testid="city-header" />,
}));

import { EditModeJourneyContent } from "../EditModeJourneyContent";

function makeDraft(): EditItinerary {
  return {
    route: [
      {
        id: "paris",
        city: "Paris",
        country: "France",
        countryCode: "FR",
        lat: 48.85,
        lng: 2.35,
        days: 1,
      },
    ],
    days: [
      {
        day: 1,
        date: "2026-06-01",
        city: "Paris",
        activities: [],
      },
    ],
    weatherData: [],
  };
}

describe("EditModeJourneyContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.expandedActivityId = null;
  });

  it("adds a manual activity and expands it", () => {
    const draft = makeDraft();
    render(
      <EditModeJourneyContent
        draft={draft}
        activeDayMap={{}}
        onDayChange={vi.fn()}
        generatingCityId={null}
        onGenerateActivities={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add manual activity" }));

    expect(mocks.updateDraft).toHaveBeenCalledTimes(1);
    const updater = mocks.updateDraft.mock.calls[0][0] as (d: EditItinerary) => EditItinerary;
    const next = updater(draft);
    expect(next.days[0].activities).toHaveLength(1);
    expect(next.days[0].activities[0].name).toBe("");
    expect(mocks.setExpandedActivityId).toHaveBeenCalledWith(next.days[0].activities[0]._editId);
  });
});
