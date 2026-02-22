// ============================================================
// Component tests for AddActivityButton
//
// Covers:
//   - Renders "Add activity" button
//   - Click opens the menu (Add manually + Suggest with AI)
//   - Clicking "Add manually" calls onAddManual and closes menu
//   - Clicking "Suggest with AI" calls onAddAI and closes menu
//   - AI option is disabled when isGeneratingAI=true
//   - Click outside closes the menu
// ============================================================

import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AddActivityButton } from "../AddActivityButton";

// lucide-react icons render as SVGs — no mock needed

function renderButton(props?: Partial<React.ComponentProps<typeof AddActivityButton>>) {
  const onAddManual = vi.fn();
  const onAddAI = vi.fn();
  render(
    <AddActivityButton
      onAddManual={onAddManual}
      onAddAI={onAddAI}
      isGeneratingAI={false}
      {...props}
    />
  );
  return { onAddManual, onAddAI };
}

describe("AddActivityButton", () => {
  it("renders the add activity button", () => {
    renderButton();
    expect(screen.getByRole("button", { name: /add activity/i })).toBeInTheDocument();
  });

  it("does not show menu by default", () => {
    renderButton();
    expect(screen.queryByText("Add manually")).not.toBeInTheDocument();
  });

  it("opens the menu when clicked", () => {
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: /add activity/i }));
    expect(screen.getByText("Add manually")).toBeInTheDocument();
    expect(screen.getByText("Suggest with AI")).toBeInTheDocument();
  });

  it("calls onAddManual and closes menu when Add manually clicked", () => {
    const { onAddManual } = renderButton();
    fireEvent.click(screen.getByRole("button", { name: /add activity/i }));
    fireEvent.click(screen.getByText("Add manually"));
    expect(onAddManual).toHaveBeenCalledOnce();
    expect(screen.queryByText("Add manually")).not.toBeInTheDocument();
  });

  it("calls onAddAI and closes menu when Suggest with AI clicked", () => {
    const { onAddAI } = renderButton();
    fireEvent.click(screen.getByRole("button", { name: /add activity/i }));
    fireEvent.click(screen.getByText("Suggest with AI"));
    expect(onAddAI).toHaveBeenCalledOnce();
    expect(screen.queryByText("Suggest with AI")).not.toBeInTheDocument();
  });

  it("disables AI button when isGeneratingAI=true", () => {
    renderButton({ isGeneratingAI: true });
    fireEvent.click(screen.getByRole("button", { name: /add activity/i }));
    const aiBtn = screen.getByText("Generating…").closest("button");
    expect(aiBtn).toBeDisabled();
  });

  it("shows 'Generating…' text when isGeneratingAI=true", () => {
    renderButton({ isGeneratingAI: true });
    fireEvent.click(screen.getByRole("button", { name: /add activity/i }));
    expect(screen.getByText("Generating…")).toBeInTheDocument();
  });

  it("closes menu on click outside", () => {
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: /add activity/i }));
    expect(screen.getByText("Add manually")).toBeInTheDocument();

    act(() => {
      fireEvent.mouseDown(document.body);
    });
    expect(screen.queryByText("Add manually")).not.toBeInTheDocument();
  });
});
