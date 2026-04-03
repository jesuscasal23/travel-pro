import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { CityRecord } from "@/types";
import { CityCombobox } from "../CityCombobox";

const MOCK_CITIES: CityRecord[] = [
  {
    id: "1",
    slug: "tokyo-jp",
    city: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    lat: 35.6828,
    lng: 139.759,
    popular: true,
  },
  {
    id: "2",
    slug: "paris-fr",
    city: "Paris",
    country: "France",
    countryCode: "FR",
    lat: 48.8566,
    lng: 2.3522,
    popular: true,
  },
  {
    id: "3",
    slug: "lima-pe",
    city: "Lima",
    country: "Peru",
    countryCode: "PE",
    lat: -12.0464,
    lng: -77.0428,
    popular: false,
  },
];

function renderCombobox(overrides: Partial<React.ComponentProps<typeof CityCombobox>> = {}) {
  return render(<CityCombobox cities={MOCK_CITIES} value="" onChange={vi.fn()} {...overrides} />);
}

describe("CityCombobox", () => {
  it("shows selected value when closed", () => {
    renderCombobox({ value: "Tokyo, Japan" });
    expect(screen.getByText("Tokyo, Japan")).toBeInTheDocument();
  });

  it("shows popular destinations on focus and selects via keyboard", async () => {
    const onChange = vi.fn();
    renderCombobox({ onChange });
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
    renderCombobox();
    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "zzzz" } });
    expect(screen.getByText(/No cities found/i)).toBeInTheDocument();
  });

  it("closes results on escape when open", () => {
    renderCombobox();
    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "tok" } });
    expect(screen.getByText("Tokyo")).toBeInTheDocument();

    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByText("Tokyo")).not.toBeInTheDocument();
  });

  it("closes dropdown on outside click", () => {
    renderCombobox();
    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    expect(screen.getByText("Popular destinations")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Popular destinations")).not.toBeInTheDocument();
  });
});
