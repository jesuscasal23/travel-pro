// ============================================================
// Component tests for EditableActivityCard
//
// Covers:
//   - Renders activity name and duration/cost
//   - Shows "Unnamed activity" when name is empty
//   - Shows drag handle button
//   - Shows delete button (desktop)
//   - Clicking expand toggle calls onToggleExpand
//   - Renders InlineActivityForm when isExpanded=true
//   - Does not render InlineActivityForm when isExpanded=false
//   - Delete button calls onDelete
// ============================================================

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EditableActivityCard } from "../EditableActivityCard";
import type { EditableActivity } from "@/stores/useEditStore";

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

// ── category-colors mock ──────────────────────────────────────────────────────
vi.mock("@/lib/utils/category-colors", () => ({
  getCategoryStyle: () => ({ bgClass: "bg-blue-500", textClass: "text-blue-700" }),
  getCategoryEmoji: () => "🎭",
}));

// ── Fixture ───────────────────────────────────────────────────────────────────

function makeActivity(overrides?: Partial<EditableActivity>): EditableActivity {
  return {
    _editId: "act-1",
    name: "Shibuya Crossing",
    category: "Culture",
    why: "Iconic",
    duration: "1h",
    cost: "Free",
    ...overrides,
  };
}

function renderCard(props?: {
  activity?: EditableActivity;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onChange?: (a: EditableActivity) => void;
  onDelete?: () => void;
}) {
  const onToggleExpand = props?.onToggleExpand ?? vi.fn();
  const onChange = props?.onChange ?? vi.fn();
  const onDelete = props?.onDelete ?? vi.fn();
  render(
    <EditableActivityCard
      activity={props?.activity ?? makeActivity()}
      isExpanded={props?.isExpanded ?? false}
      onToggleExpand={onToggleExpand}
      onChange={onChange}
      onDelete={onDelete}
      isFirst={true}
      isLast={true}
    />
  );
  return { onToggleExpand, onChange, onDelete };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("EditableActivityCard", () => {
  it("renders the activity name", () => {
    renderCard();
    expect(screen.getByText("Shibuya Crossing")).toBeInTheDocument();
  });

  it("renders duration and cost combined", () => {
    renderCard();
    expect(screen.getByText("1h · Free")).toBeInTheDocument();
  });

  it("shows 'Unnamed activity' when name is empty", () => {
    renderCard({ activity: makeActivity({ name: "" }) });
    expect(screen.getByText("Unnamed activity")).toBeInTheDocument();
  });

  it("shows only duration when cost is absent", () => {
    renderCard({ activity: makeActivity({ cost: undefined }) });
    expect(screen.getByText("1h")).toBeInTheDocument();
  });

  it("renders drag handle button", () => {
    renderCard();
    expect(screen.getByRole("button", { name: /drag to reorder/i })).toBeInTheDocument();
  });

  it("renders desktop delete button", () => {
    renderCard();
    // There are two delete buttons (mobile + desktop); at least one should be visible
    const deleteBtns = screen.getAllByRole("button", { name: /delete activity/i });
    expect(deleteBtns.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onToggleExpand when tapping the card body", () => {
    const { onToggleExpand } = renderCard();
    // Find the expand toggle button by its aria-expanded attribute
    const ariaBtn = document.querySelector("[aria-expanded]") as HTMLButtonElement;
    expect(ariaBtn).not.toBeNull();
    fireEvent.click(ariaBtn);
    expect(onToggleExpand).toHaveBeenCalledOnce();
  });

  it("does not render InlineActivityForm when not expanded", () => {
    renderCard({ isExpanded: false });
    expect(screen.queryByPlaceholderText("Activity name")).not.toBeInTheDocument();
  });

  it("renders InlineActivityForm when expanded", () => {
    renderCard({ isExpanded: true });
    expect(screen.getByPlaceholderText("Activity name")).toBeInTheDocument();
  });

  it("calls onDelete when delete button clicked", () => {
    const { onDelete } = renderCard();
    const deleteBtns = screen.getAllByRole("button", { name: /delete activity/i });
    fireEvent.click(deleteBtns[0]);
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
