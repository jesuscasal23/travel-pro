// ============================================================
// Component tests for InlineActivityForm
//
// Covers:
//   - Renders all fields with initial values
//   - onChange called on blur only when value changes
//   - onChange NOT called when value is unchanged
//   - Done button calls onDone
//   - Multiple field updates each call onChange
// ============================================================

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { InlineActivityForm } from "../InlineActivityForm";
import type { EditableActivity } from "@/stores/useEditStore";

function makeActivity(overrides?: Partial<EditableActivity>): EditableActivity {
  return {
    _editId: "test-id-1",
    name: "Shibuya Crossing",
    category: "Culture",
    why: "Iconic location",
    duration: "1 hour",
    cost: "Free",
    tip: "Go at night",
    food: "Matcha latte nearby",
    ...overrides,
  };
}

describe("InlineActivityForm", () => {
  it("renders name field with initial value", () => {
    const onChange = vi.fn();
    render(<InlineActivityForm activity={makeActivity()} onChange={onChange} onDone={vi.fn()} />);
    expect(screen.getByPlaceholderText("Activity name")).toHaveValue("Shibuya Crossing");
  });

  it("renders duration field with initial value", () => {
    render(<InlineActivityForm activity={makeActivity()} onChange={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByPlaceholderText("e.g. 2 hours")).toHaveValue("1 hour");
  });

  it("renders cost field with initial value", () => {
    render(<InlineActivityForm activity={makeActivity()} onChange={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByPlaceholderText("e.g. ¥500 or Free")).toHaveValue("Free");
  });

  it("renders why field with initial value", () => {
    render(<InlineActivityForm activity={makeActivity()} onChange={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByPlaceholderText("Why this activity?")).toHaveValue("Iconic location");
  });

  it("calls onChange when name field is blurred with new value", () => {
    const onChange = vi.fn();
    render(<InlineActivityForm activity={makeActivity()} onChange={onChange} onDone={vi.fn()} />);

    const nameInput = screen.getByPlaceholderText("Activity name");
    fireEvent.change(nameInput, { target: { value: "New Name" } });
    fireEvent.blur(nameInput);

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].name).toBe("New Name");
  });

  it("does NOT call onChange when value is blurred without change", () => {
    const onChange = vi.fn();
    const activity = makeActivity();
    render(<InlineActivityForm activity={activity} onChange={onChange} onDone={vi.fn()} />);

    const nameInput = screen.getByPlaceholderText("Activity name");
    fireEvent.blur(nameInput);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls onChange with updated _editId preserved", () => {
    const onChange = vi.fn();
    const activity = makeActivity({ _editId: "preserved-id" });
    render(<InlineActivityForm activity={activity} onChange={onChange} onDone={vi.fn()} />);

    const nameInput = screen.getByPlaceholderText("Activity name");
    fireEvent.change(nameInput, { target: { value: "Updated" } });
    fireEvent.blur(nameInput);

    expect(onChange.mock.calls[0][0]._editId).toBe("preserved-id");
  });

  it("calls onDone when Done button clicked", () => {
    const onDone = vi.fn();
    render(<InlineActivityForm activity={makeActivity()} onChange={vi.fn()} onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: /done/i }));
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("calls onChange for duration field on blur", () => {
    const onChange = vi.fn();
    render(<InlineActivityForm activity={makeActivity()} onChange={onChange} onDone={vi.fn()} />);

    const durInput = screen.getByPlaceholderText("e.g. 2 hours");
    fireEvent.change(durInput, { target: { value: "3 hours" } });
    fireEvent.blur(durInput);

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].duration).toBe("3 hours");
  });

  it("handles empty optional fields gracefully (food, tip, cost)", () => {
    const onChange = vi.fn();
    const activity = makeActivity({ cost: undefined, food: undefined, tip: undefined });
    render(<InlineActivityForm activity={activity} onChange={onChange} onDone={vi.fn()} />);

    // Fields should render with empty values
    expect(screen.getByPlaceholderText("e.g. ¥500 or Free")).toHaveValue("");
    expect(screen.getByPlaceholderText("Optional food recommendation")).toHaveValue("");
    expect(screen.getByPlaceholderText("Optional travel tip")).toHaveValue("");
  });
});
