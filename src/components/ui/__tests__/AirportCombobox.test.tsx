import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AirportCombobox } from "../AirportCombobox";

describe("AirportCombobox", () => {
  it("shows display label from stored value when closed", () => {
    render(<AirportCombobox value="FRA - Frankfurt Airport (Frankfurt, DE)" onChange={vi.fn()} />);
    expect(screen.getByText(/FRA .+ Frankfurt, DE/i)).toBeInTheDocument();
  });

  it("filters results and selects an airport via keyboard", async () => {
    const onChange = vi.fn();
    render(<AirportCombobox value="" onChange={onChange} />);
    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "fra" } });

    expect(screen.getByText("FRA")).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(onChange.mock.calls[0][0]).toMatch(/^[A-Z]{3}/);
  });

  it("shows no-results text for unmatched query", () => {
    render(<AirportCombobox value="" onChange={vi.fn()} />);
    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "zzzz" } });
    expect(screen.getByText(/No airports found/i)).toBeInTheDocument();
  });

  it("closes results on escape when results are visible", () => {
    render(<AirportCombobox value="" onChange={vi.fn()} />);
    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "fra" } });
    expect(screen.getByText("FRA")).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByText("FRA")).not.toBeInTheDocument();
  });

  it("closes results on outside click", () => {
    render(<AirportCombobox value="" onChange={vi.fn()} />);
    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "fra" } });
    expect(screen.getByText("FRA")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("FRA")).not.toBeInTheDocument();
  });
});
