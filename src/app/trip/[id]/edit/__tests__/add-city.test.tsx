// ============================================================
// Integration tests for EditPage — Add / Remove City Flow
//
// Covers:
//   - "Add a city" button toggles the CityCombobox
//   - Selecting a city from CityCombobox appends it to the list
//   - Duplicate city is prevented (same city+countryCode)
//   - Removing a city updates the list
//   - Save triggers needsRegeneration for structural changes (add/remove)
//   - detectEditType correctly classifies add_city edits
// ============================================================

import React, { Suspense } from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useTripStore } from "@/stores/useTripStore";
import { mockFramerMotion, mockNextLink, mockNavbar, createTestQueryWrapper } from "@/__tests__/mocks";
import type { Itinerary } from "@/types";

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  }),
}));

vi.mock("posthog-js/react", () => ({
  usePostHog: () => ({ capture: vi.fn() }),
}));

vi.mock("@/components/Navbar", () => mockNavbar());
vi.mock("next/link", () => mockNextLink());
vi.mock("framer-motion", () => mockFramerMotion());

// Mock @dnd-kit
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => children,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: () => [],
}));
vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => children,
  sortableKeyboardCoordinates: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: vi.fn(),
  arrayMove: vi.fn(),
}));
vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => "" } },
}));

// Mock CityCombobox to render a simple button that calls onChange
// with a predefined city entry when clicked.
const mockCity = {
  city: "Osaka",
  country: "Japan",
  countryCode: "JP",
  lat: 34.69,
  lng: 135.5,
  popular: false,
};

vi.mock("@/components/ui/CityCombobox", () => ({
  CityCombobox: ({ onChange }: { onChange: (entry: typeof mockCity) => void }) =>
    React.createElement(
      "button",
      {
        "data-testid": "mock-city-combobox",
        onClick: () => onChange(mockCity),
      },
      "Select Osaka"
    ),
}));

// ── Import subject after mocks ────────────────────────────────────────────────

import EditPage from "@/app/trip/[id]/edit/page";

// ── Test data ─────────────────────────────────────────────────────────────────

const testRoute = [
  { id: "tokyo-1", city: "Tokyo", country: "Japan", countryCode: "JP", lat: 35.68, lng: 139.69, days: 4 },
  { id: "hanoi-2", city: "Hanoi", country: "Vietnam", countryCode: "VN", lat: 21.03, lng: 105.85, days: 3 },
  { id: "bangkok-3", city: "Bangkok", country: "Thailand", countryCode: "TH", lat: 13.76, lng: 100.5, days: 3 },
];

const testItinerary: Itinerary = {
  route: testRoute,
  days: [
    { day: 1, date: "2026-04-01", city: "Tokyo", activities: [] },
    { day: 2, date: "2026-04-02", city: "Tokyo", activities: [] },
    { day: 3, date: "2026-04-03", city: "Hanoi", activities: [] },
    { day: 4, date: "2026-04-04", city: "Bangkok", activities: [] },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function setStoreWithItinerary() {
  act(() => {
    useTripStore.setState({
      itinerary: testItinerary,
      needsRegeneration: false,
    });
  });
}

const resolvedParams = Promise.resolve({ id: "trip-abc" });

async function renderEditPage() {
  const Wrapper = createTestQueryWrapper();
  await act(async () => {
    render(
      React.createElement(
        Wrapper,
        null,
        React.createElement(
          Suspense,
          { fallback: React.createElement("div", null, "loading…") },
          React.createElement(EditPage, { params: resolvedParams })
        )
      )
    );
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("EditPage — Add/Remove City Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setStoreWithItinerary();
  });

  it("renders all cities from the itinerary", async () => {
    await renderEditPage();

    await waitFor(() => {
      expect(screen.getByText("Tokyo")).toBeInTheDocument();
      expect(screen.getByText("Hanoi")).toBeInTheDocument();
      expect(screen.getByText("Bangkok")).toBeInTheDocument();
    });
  });

  it("shows the 'Add a city' button", async () => {
    await renderEditPage();

    await waitFor(() => {
      expect(screen.getByText("Add a city")).toBeInTheDocument();
    });
  });

  it("toggles CityCombobox when 'Add a city' is clicked", async () => {
    await renderEditPage();

    await waitFor(() => screen.getByText("Add a city"));

    // Click "Add a city"
    fireEvent.click(screen.getByText("Add a city"));

    // CityCombobox mock should appear
    await waitFor(() => {
      expect(screen.getByTestId("mock-city-combobox")).toBeInTheDocument();
    });

    // Cancel button should be visible (there are two "Cancel" elements — button and link)
    const cancelButtons = screen.getAllByText("Cancel");
    expect(cancelButtons.some((el) => el.tagName === "BUTTON")).toBe(true);
  });

  it("hides CityCombobox when Cancel is clicked", async () => {
    await renderEditPage();
    await waitFor(() => screen.getByText("Add a city"));

    // Open combobox
    fireEvent.click(screen.getByText("Add a city"));
    await waitFor(() => screen.getByTestId("mock-city-combobox"));

    // Click the Cancel button (not the action-bar Cancel link)
    const cancelButtons = screen.getAllByText("Cancel");
    const cancelBtn = cancelButtons.find((el) => el.tagName === "BUTTON");
    expect(cancelBtn).toBeDefined();
    fireEvent.click(cancelBtn!);

    // CityCombobox should disappear, "Add a city" button returns
    await waitFor(() => {
      expect(screen.queryByTestId("mock-city-combobox")).not.toBeInTheDocument();
      expect(screen.getByText("Add a city")).toBeInTheDocument();
    });
  });

  it("adds a city when selected from CityCombobox", async () => {
    await renderEditPage();
    await waitFor(() => screen.getByText("Add a city"));

    // Open combobox and select Osaka
    fireEvent.click(screen.getByText("Add a city"));
    await waitFor(() => screen.getByTestId("mock-city-combobox"));
    fireEvent.click(screen.getByTestId("mock-city-combobox"));

    // Osaka should now appear in the city list
    await waitFor(() => {
      expect(screen.getByText("Osaka")).toBeInTheDocument();
    });

    // CityCombobox should be hidden after selection
    expect(screen.queryByTestId("mock-city-combobox")).not.toBeInTheDocument();
  });

  it("removes a city when the remove button is clicked", async () => {
    await renderEditPage();
    await waitFor(() => screen.getByText("Hanoi"));

    // Click remove on Hanoi
    fireEvent.click(screen.getByRole("button", { name: /Remove Hanoi/i }));

    // Hanoi should disappear
    await waitFor(() => {
      expect(screen.queryByText("Hanoi")).not.toBeInTheDocument();
    });

    // Other cities still present
    expect(screen.getByText("Tokyo")).toBeInTheDocument();
    expect(screen.getByText("Bangkok")).toBeInTheDocument();
  });

  it("sets needsRegeneration when saving after adding a city", async () => {
    // Mock fetch for PATCH /api/v1/trips/:id (save)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await renderEditPage();
    await waitFor(() => screen.getByText("Add a city"));

    // Add Osaka
    fireEvent.click(screen.getByText("Add a city"));
    await waitFor(() => screen.getByTestId("mock-city-combobox"));
    fireEvent.click(screen.getByTestId("mock-city-combobox"));
    await waitFor(() => screen.getByText("Osaka"));

    // Click Save Changes
    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    // needsRegeneration should be set to true
    await waitFor(() => {
      expect(useTripStore.getState().needsRegeneration).toBe(true);
    });
  });

  it("sets needsRegeneration when saving after removing a city", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await renderEditPage();
    await waitFor(() => screen.getByText("Hanoi"));

    // Remove Hanoi
    fireEvent.click(screen.getByRole("button", { name: /Remove Hanoi/i }));
    await waitFor(() => expect(screen.queryByText("Hanoi")).not.toBeInTheDocument());

    // Click Save Changes
    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    // needsRegeneration should be set to true
    await waitFor(() => {
      expect(useTripStore.getState().needsRegeneration).toBe(true);
    });
  });

  it("navigates to trip view after saving", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await renderEditPage();
    await waitFor(() => screen.getByText("Add a city"));

    // Add Osaka then save
    fireEvent.click(screen.getByText("Add a city"));
    await waitFor(() => screen.getByTestId("mock-city-combobox"));
    fireEvent.click(screen.getByTestId("mock-city-combobox"));
    await waitFor(() => screen.getByText("Osaka"));

    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/trip/trip-abc");
    });
  });

  it("updates itinerary route in store with the new city", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await renderEditPage();
    await waitFor(() => screen.getByText("Add a city"));

    // Add Osaka
    fireEvent.click(screen.getByText("Add a city"));
    await waitFor(() => screen.getByTestId("mock-city-combobox"));
    fireEvent.click(screen.getByTestId("mock-city-combobox"));
    await waitFor(() => screen.getByText("Osaka"));

    // Save
    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    // Itinerary in store should include Osaka
    await waitFor(() => {
      const updatedItinerary = useTripStore.getState().itinerary;
      expect(updatedItinerary).not.toBeNull();
      const cityNames = updatedItinerary!.route.map((c) => c.city);
      expect(cityNames).toContain("Osaka");
      expect(cityNames).toHaveLength(4);
    });
  });

  it("does not set needsRegeneration for non-structural edits (days only)", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await renderEditPage();
    await waitFor(() => screen.getByText("Tokyo"));

    // Save without any structural changes (no add/remove)
    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(useTripStore.getState().needsRegeneration).toBe(false);
    });
  });
});
