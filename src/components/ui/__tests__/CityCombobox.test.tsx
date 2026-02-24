import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CityCombobox } from "../CityCombobox";

describe("CityCombobox", () => {
  it("shows selected value when closed", () => {
    render(<CityCombobox value="Tokyo, Japan" onChange={vi.fn()} />);
    expect(screen.getByText("Tokyo, Japan")).toBeInTheDocument();
  });

  it("shows popular destinations on focus and selects via keyboard", async () => {
    const onChange = vi.fn();
    render(<CityCombobox value="" onChange={onChange} />);
    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    expect(screen.getByText("Popular destinations")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "tok" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(onChange.mock.calls[0][0]).toMatchObject({
      city: "Tokyo",
      country: "Japan",
      countryCode: "JP",
    });
  });

  it("shows no-results state for unmatched query", () => {
    render(<CityCombobox value="" onChange={vi.fn()} />);
    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "zzzz" } });
    expect(screen.getByText(/No cities found/i)).toBeInTheDocument();
  });

  it("closes results on escape when open", () => {
    render(<CityCombobox value="" onChange={vi.fn()} />);
    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "tok" } });
    expect(screen.getByText("Tokyo")).toBeInTheDocument();

    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByText("Tokyo")).not.toBeInTheDocument();
  });

  it("closes dropdown on outside click", () => {
    render(<CityCombobox value="" onChange={vi.fn()} />);
    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    expect(screen.getByText("Popular destinations")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Popular destinations")).not.toBeInTheDocument();
  });
});
