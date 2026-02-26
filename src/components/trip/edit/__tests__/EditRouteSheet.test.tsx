import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CityStop } from "@/types";
import { EditRouteSheet } from "../EditRouteSheet";

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({
    children,
    onDragEnd,
  }: {
    children: React.ReactNode;
    onDragEnd: (event: { active: { id: string }; over: { id: string } }) => void;
  }) => (
    <div>
      {children}
      <button onClick={() => onDragEnd({ active: { id: "c1" }, over: { id: "c2" } })}>
        simulate drag
      </button>
    </div>
  ),
  closestCenter: vi.fn(),
  PointerSensor: class {},
  TouchSensor: class {},
  KeyboardSensor: class {},
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  verticalListSortingStrategy: vi.fn(),
  sortableKeyboardCoordinates: vi.fn(),
  arrayMove: <T,>(arr: T[], oldIndex: number, newIndex: number) => {
    const next = arr.slice();
    const [item] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, item);
    return next;
  },
}));

vi.mock("../SortableCityCard", () => ({
  SortableCityCard: ({
    city,
    onDaysChange,
    onRemove,
  }: {
    city: CityStop;
    onDaysChange: (id: string, days: number) => void;
    onRemove: (id: string) => void;
  }) => (
    <div>
      <span>{city.city}</span>
      <button onClick={() => onDaysChange(city.id, city.days + 1)}>increase {city.city}</button>
      <button onClick={() => onRemove(city.id)}>remove {city.city}</button>
    </div>
  ),
}));

vi.mock("@/components/ui/CityCombobox", () => ({
  CityCombobox: ({
    onChange,
  }: {
    onChange: (entry: {
      city: string;
      country: string;
      countryCode: string;
      lat: number;
      lng: number;
    }) => void;
  }) => (
    <button
      onClick={() =>
        onChange({
          city: "Rome",
          country: "Italy",
          countryCode: "IT",
          lat: 41.9,
          lng: 12.49,
        })
      }
    >
      add city
    </button>
  ),
}));

function makeCities(): CityStop[] {
  return [
    {
      id: "c1",
      city: "Paris",
      country: "France",
      countryCode: "FR",
      lat: 48.85,
      lng: 2.35,
      days: 2,
    },
    {
      id: "c2",
      city: "Berlin",
      country: "Germany",
      countryCode: "DE",
      lat: 52.52,
      lng: 13.4,
      days: 3,
    },
  ];
}

describe("EditRouteSheet", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(crypto, "randomUUID").mockReturnValue("new-city-id");
  });

  it("renders mobile sheet, supports reorder, and closes", () => {
    const onCitiesChange = vi.fn();
    const onClose = vi.fn();
    render(
      <EditRouteSheet
        variant="mobile"
        cities={makeCities()}
        onCitiesChange={onCitiesChange}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "simulate drag" }));
    expect(onCitiesChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: "c2" }),
      expect.objectContaining({ id: "c1" }),
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("updates city days and removes city entries", () => {
    const onCitiesChange = vi.fn();
    render(
      <EditRouteSheet
        variant="desktop"
        cities={makeCities()}
        onCitiesChange={onCitiesChange}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "increase Paris" }));
    expect(onCitiesChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: "c1", days: 3 }),
      expect.objectContaining({ id: "c2", days: 3 }),
    ]);

    fireEvent.click(screen.getByRole("button", { name: "remove Berlin" }));
    expect(onCitiesChange).toHaveBeenCalledWith([expect.objectContaining({ id: "c1" })]);
  });

  it("adds a city from combobox selection", () => {
    const onCitiesChange = vi.fn();
    render(
      <EditRouteSheet
        variant="desktop"
        cities={makeCities()}
        onCitiesChange={onCitiesChange}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "add city" }));
    expect(onCitiesChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: "c1" }),
      expect.objectContaining({ id: "c2" }),
      expect.objectContaining({
        id: "new-city-id",
        city: "Rome",
        country: "Italy",
        countryCode: "IT",
        days: 3,
      }),
    ]);
  });
});
