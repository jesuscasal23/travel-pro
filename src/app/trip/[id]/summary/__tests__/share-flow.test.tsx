import React, { Suspense } from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockFramerMotion, mockNavbar } from "@/__tests__/mocks";
import type { Itinerary } from "@/types";

const mocks = vi.hoisted(() => ({
  itinerary: null as Itinerary | null,
  mutateAsync: vi.fn(),
  capture: vi.fn(),
}));

vi.mock("framer-motion", () => mockFramerMotion());

vi.mock("@/components/Navbar", () => mockNavbar());

vi.mock("@/components/ui", () => ({
  BackLink: ({ href, label }: { href: string; label: string }) => <a href={href}>{label}</a>,
  Button: ({
    children,
    onClick,
    loading,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    loading?: boolean;
  }) => (
    <button onClick={onClick} disabled={loading}>
      {children}
    </button>
  ),
  Skeleton: () => <div data-testid="skeleton" />,
}));

vi.mock("@/components/export/PDFDownloadButton", () => ({
  PDFDownloadButton: () => <button>Export PDF</button>,
}));

vi.mock("@/components/trip/ShareModal", () => ({
  ShareModal: ({ open, shareUrl }: { open: boolean; shareUrl: string | null }) =>
    open ? <div data-testid="share-modal">{shareUrl}</div> : null,
}));

vi.mock("posthog-js/react", () => ({
  usePostHog: () => ({ capture: mocks.capture }),
}));

vi.mock("@/hooks/useItinerary", () => ({
  useItinerary: () => mocks.itinerary,
}));

vi.mock("@/stores/useTripStore", () => ({
  useTripStore: (selector?: (s: { travelers: number }) => unknown) => {
    const state = { travelers: 2 };
    if (!selector) return state;
    return selector(state);
  },
}));

vi.mock("@/hooks/api", () => ({
  useShareTrip: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/lib/affiliate/link-generator", () => ({
  buildFlightLink: vi.fn(() => "https://www.skyscanner.com"),
  buildTrackedLink: vi.fn(({ dest }: { dest: string }) => dest),
}));

import SummaryPage from "@/app/trip/[id]/summary/page";

function makeItinerary(): Itinerary {
  return {
    route: [
      {
        id: "paris",
        city: "Paris",
        country: "France",
        countryCode: "FR",
        lat: 48.85,
        lng: 2.35,
        days: 2,
        iataCode: "CDG",
      },
    ],
    days: [
      {
        day: 1,
        date: "2026-06-01",
        city: "Paris",
        activities: [{ name: "Louvre", category: "Culture", why: "Art", duration: "2h" }],
      },
      {
        day: 2,
        date: "2026-06-02",
        city: "Paris",
        activities: [{ name: "Montmartre", category: "Leisure", why: "Views", duration: "3h" }],
      },
    ],
    visaData: [],
    weatherData: [],
  };
}

async function renderWithSuspense(id: string) {
  await act(async () => {
    render(
      <Suspense fallback={<div>loading</div>}>
        <SummaryPage params={Promise.resolve({ id })} />
      </Suspense>
    );
  });
}

describe("SummaryPage share flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.itinerary = makeItinerary();
  });

  it("opens share modal with guest trip URL without calling share mutation", async () => {
    mocks.mutateAsync.mockResolvedValue({ shareToken: "unused" });
    await renderWithSuspense("guest");

    fireEvent.click(screen.getByRole("button", { name: /share/i }));

    await waitFor(() => expect(screen.getByTestId("share-modal")).toBeInTheDocument());
    expect(screen.getByTestId("share-modal")).toHaveTextContent(
      `${window.location.origin}/trip/guest`
    );
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it("opens share modal and fetches share token for saved trips", async () => {
    mocks.mutateAsync.mockResolvedValue({ shareToken: "token-123" });
    await renderWithSuspense("trip-123");

    fireEvent.click(screen.getByRole("button", { name: /share/i }));

    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledWith("trip-123"));
    await waitFor(() =>
      expect(screen.getByTestId("share-modal")).toHaveTextContent(
        `${window.location.origin}/share/token-123`
      )
    );
  });
});
