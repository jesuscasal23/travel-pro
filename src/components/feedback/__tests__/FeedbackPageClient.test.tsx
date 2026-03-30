import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockNextLink } from "@/__tests__/mocks";

const mockUseFeedback = vi.fn();

vi.mock("next/link", () => mockNextLink());

vi.mock("@/components/ui/AppScreen", () => ({
  AppScreen: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/hooks/api", () => ({
  useFeedback: () => mockUseFeedback(),
}));

vi.mock("@/components/feedback/FeedbackComposerModal", () => ({
  FeedbackComposerModal: ({ open }: { open: boolean }) => (open ? <div>Feedback modal open</div> : null),
}));

import { FeedbackPageClient } from "../FeedbackPageClient";

describe("FeedbackPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the empty state when the user has no submissions", () => {
    mockUseFeedback.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<FeedbackPageClient />);

    expect(screen.getByText(/Nothing submitted yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Your ideas, bug reports, and wins/i)).toBeInTheDocument();
  });

  it("renders populated feedback items with statuses and staff notes", () => {
    mockUseFeedback.mockReturnValue({
      data: [
        {
          id: "feedback-1",
          category: "bug_report",
          categoryLabel: "Bug report",
          title: "Map jumps",
          description: "The trip map jumps to the wrong city when I open it.",
          status: "under_review",
          statusLabel: "Under review",
          sourceRoute: "/trips/trip-1",
          tripId: "trip-1",
          appVersion: "0.4.0",
          browserInfo: null,
          createdAt: "2026-03-30T12:00:00.000Z",
          updatedAt: "2026-03-30T12:00:00.000Z",
          latestStaffNote: "We reproduced this and are investigating.",
          latestStaffUpdateAt: "2026-03-31T12:00:00.000Z",
          screenshot: {
            filename: "screenshot.png",
            contentType: "image/png",
            sizeBytes: 1234,
            url: "https://signed-url.test/screenshot",
          },
          linearIssue: null,
          latestUpdate: {
            id: "update-1",
            status: "under_review",
            statusLabel: "Under review",
            staffNote: "We reproduced this and are investigating.",
            createdAt: "2026-03-31T12:00:00.000Z",
            emailDeliveryStatus: "sent",
            emailedAt: "2026-03-31T12:01:00.000Z",
          },
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<FeedbackPageClient />);

    expect(screen.getByText("Map jumps")).toBeInTheDocument();
    expect(screen.getByText("Bug report")).toBeInTheDocument();
    expect(screen.getByText("Under review")).toBeInTheDocument();
    expect(screen.getByText(/We reproduced this and are investigating/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Screenshot for Map jumps/i)).toHaveAttribute(
      "src",
      "https://signed-url.test/screenshot"
    );
  });

  it("opens the composer from the header action", () => {
    mockUseFeedback.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<FeedbackPageClient />);
    fireEvent.click(screen.getByRole("button", { name: /Share feedback/i }));

    expect(screen.getByText("Feedback modal open")).toBeInTheDocument();
  });
});
