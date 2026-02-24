import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CountryCombobox } from "../CountryCombobox";

describe("CountryCombobox", () => {
  it("shows selected value when input is not focused", () => {
    render(<CountryCombobox value="Japan" onChange={vi.fn()} />);
    expect(screen.getByText("Japan")).toBeInTheDocument();
  });

  it("shows popular countries on focus and selects by keyboard", async () => {
    const onChange = vi.fn();
    render(<CountryCombobox value="" onChange={onChange} />);
    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    expect(screen.getByText("Popular countries")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "jap" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(onChange.mock.calls[0][0]).toMatchObject({
      country: "Japan",
      countryCode: "JP",
    });
  });

  it("shows no-results state for unmatched query", () => {
    render(<CountryCombobox value="" onChange={vi.fn()} />);
    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "zzzz" } });
    expect(screen.getByText(/No countries found/i)).toBeInTheDocument();
  });

  it("closes dropdown on escape when results are visible", () => {
    render(<CountryCombobox value="" onChange={vi.fn()} />);
    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "jap" } });
    expect(screen.getByText("Japan")).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByText("Japan")).not.toBeInTheDocument();
  });

  it("closes dropdown on outside click", () => {
    render(<CountryCombobox value="" onChange={vi.fn()} />);
    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    expect(screen.getByText("Popular countries")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Popular countries")).not.toBeInTheDocument();
  });
});
