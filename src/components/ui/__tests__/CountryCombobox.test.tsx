import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { CountryRecord } from "@/types";
import { CountryCombobox } from "../CountryCombobox";

const MOCK_COUNTRIES: CountryRecord[] = [
  { country: "Japan", countryCode: "JP", lat: 35.6, lng: 139.7, popular: true },
  { country: "France", countryCode: "FR", lat: 48.8, lng: 2.3, popular: true },
  { country: "Peru", countryCode: "PE", lat: -12.0, lng: -77.0, popular: false },
];

function renderCountryCombobox(
  overrides: Partial<React.ComponentProps<typeof CountryCombobox>> = {}
) {
  return render(
    <CountryCombobox countries={MOCK_COUNTRIES} value="" onChange={vi.fn()} {...overrides} />
  );
}

describe("CountryCombobox", () => {
  it("shows selected value when input is not focused", () => {
    renderCountryCombobox({ value: "Japan" });
    expect(screen.getByText("Japan")).toBeInTheDocument();
  });

  it("shows popular countries on focus and selects by keyboard", async () => {
    const onChange = vi.fn();
    renderCountryCombobox({ onChange });
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
    renderCountryCombobox();
    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "zzzz" } });
    expect(screen.getByText(/No countries found/i)).toBeInTheDocument();
  });

  it("closes dropdown on escape when results are visible", () => {
    renderCountryCombobox();
    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "jap" } });
    expect(screen.getByText("Japan")).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByText("Japan")).not.toBeInTheDocument();
  });

  it("closes dropdown on outside click", () => {
    renderCountryCombobox();
    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    expect(screen.getByText("Popular countries")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Popular countries")).not.toBeInTheDocument();
  });
});
