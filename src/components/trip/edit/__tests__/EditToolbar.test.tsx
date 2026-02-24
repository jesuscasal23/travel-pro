import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EditToolbar } from "../EditToolbar";

describe("EditToolbar", () => {
  it("renders mobile controls and triggers actions", () => {
    const onUndo = vi.fn();
    const onDiscard = vi.fn();
    const onSave = vi.fn();

    render(
      <EditToolbar
        variant="mobile"
        canUndo
        hasChanges
        onUndo={onUndo}
        onDiscard={onDiscard}
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /undo/i }));
    fireEvent.click(screen.getByRole("button", { name: /discard/i }));
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("renders desktop controls and disables undo when unavailable", () => {
    const onUndo = vi.fn();
    const onDiscard = vi.fn();
    const onSave = vi.fn();

    render(
      <EditToolbar
        variant="desktop"
        canUndo={false}
        hasChanges={false}
        onUndo={onUndo}
        onDiscard={onDiscard}
        onSave={onSave}
      />,
    );

    const undo = screen.getByRole("button", { name: /undo/i });
    expect(undo).toBeDisabled();

    fireEvent.click(undo);
    fireEvent.click(screen.getByRole("button", { name: /discard/i }));
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(onUndo).not.toHaveBeenCalled();
    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
