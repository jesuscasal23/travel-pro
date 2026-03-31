import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/hooks/api", () => ({
  useTrips: () => ({ trips: [], isSuperUser: false, isLoading: false }),
  useTrip: vi.fn(),
  useBookingClicks: vi.fn(),
  useManualBooking: vi.fn(),
  useTravelerPreferences: vi.fn(),
  useAuthStatus: vi.fn(),
}));

vi.mock("@/components/ui/AppScreen", () => ({
  AppScreen: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/changelog/WhatsNewModal", () => ({
  WhatsNewModal: () => null,
}));

vi.mock("@/components/feedback/FeedbackComposerModal", () => ({
  FeedbackComposerModal: () => null,
}));

import HomePage from "../page";

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the v1 feedback entry point in the home header", () => {
    render(<HomePage />);

    expect(screen.getAllByRole("button", { name: /Share feedback/i })[0]).toBeInTheDocument();
    expect(screen.getByText(/Shape Fichi/i)).toBeInTheDocument();
  });
});
