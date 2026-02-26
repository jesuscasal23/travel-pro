// ============================================================
// Component tests for SortableCityCard
//
// Covers:
//   - Renders city name and country
//   - Renders current day count
//   - Increase/decrease day stepper buttons call onDaysChange
//   - Decrease doesn't go below 1 day (min guard)
//   - Remove button calls onRemove
//   - Drag handle is present
// ============================================================

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SortableCityCard } from "../SortableCityCard";
import type { CityStop } from "@/types";

// ── dnd-kit mock ──────────────────────────────────────────────────────────────
vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));
vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => "" } },
}));

// ── Fixture ───────────────────────────────────────────────────────────────────

function makeCity(overrides?: Partial<CityStop>): CityStop {
  return {
    id: "city-1",
    city: "Tokyo",
    country: "Japan",
    lat: 35.68,
    lng: 139.69,
    days: 3,
    countryCode: "JP",
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("SortableCityCard", () => {
  it("renders city name", () => {
    render(<SortableCityCard city={makeCity()} onDaysChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText("Tokyo")).toBeInTheDocument();
  });

  it("renders country", () => {
    render(<SortableCityCard city={makeCity()} onDaysChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText("Japan")).toBeInTheDocument();
  });

  it("renders current day count", () => {
    render(
      <SortableCityCard city={makeCity({ days: 5 })} onDaysChange={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.getByText("5d")).toBeInTheDocument();
  });

  it("calls onDaysChange with +1 when increase button clicked", () => {
    const onDaysChange = vi.fn();
    render(
      <SortableCityCard
        city={makeCity({ days: 3 })}
        onDaysChange={onDaysChange}
        onRemove={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /increase days/i }));
    expect(onDaysChange).toHaveBeenCalledWith("city-1", 4);
  });

  it("calls onDaysChange with -1 when decrease button clicked", () => {
    const onDaysChange = vi.fn();
    render(
      <SortableCityCard
        city={makeCity({ days: 3 })}
        onDaysChange={onDaysChange}
        onRemove={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /decrease days/i }));
    expect(onDaysChange).toHaveBeenCalledWith("city-1", 2);
  });

  it("does not go below 1 day when decrease clicked at minimum", () => {
    const onDaysChange = vi.fn();
    render(
      <SortableCityCard
        city={makeCity({ days: 1 })}
        onDaysChange={onDaysChange}
        onRemove={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /decrease days/i }));
    // Math.max(1, 1-1) = 1
    expect(onDaysChange).toHaveBeenCalledWith("city-1", 1);
  });

  it("calls onRemove when desktop remove button clicked", () => {
    const onRemove = vi.fn();
    render(<SortableCityCard city={makeCity()} onDaysChange={vi.fn()} onRemove={onRemove} />);
    const removeBtns = screen.getAllByRole("button", { name: /remove tokyo/i });
    fireEvent.click(removeBtns[0]);
    expect(onRemove).toHaveBeenCalledWith("city-1");
  });

  it("renders drag handle button", () => {
    render(<SortableCityCard city={makeCity()} onDaysChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByRole("button", { name: /drag to reorder/i })).toBeInTheDocument();
  });
});
