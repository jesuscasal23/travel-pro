import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockNextLink } from "@/__tests__/mocks";

const mockMutateAsync = vi.fn();
const mockReset = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/home",
}));

vi.mock("next/link", () => mockNextLink());

vi.mock("@/hooks/api", () => ({
  useCreateFeedback: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    reset: mockReset,
  }),
}));

import { FeedbackComposerModal } from "../FeedbackComposerModal";

describe("FeedbackComposerModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({
      id: "feedback-1",
      title: "Offline mode",
    });
  });

  it("shows strong founding-user framing", () => {
    render(<FeedbackComposerModal open onOpenChange={vi.fn()} />);

    expect(screen.getByText(/founding user channel/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Early users are shaping the roadmap, and what you send here directly/i)
    ).toBeInTheDocument();
  });

  it("does not reset the mutation on initial closed mount, only after closing", () => {
    const { rerender } = render(<FeedbackComposerModal open={false} onOpenChange={vi.fn()} />);

    expect(mockReset).not.toHaveBeenCalled();

    rerender(<FeedbackComposerModal open onOpenChange={vi.fn()} />);
    expect(mockReset).not.toHaveBeenCalled();

    rerender(<FeedbackComposerModal open={false} onOpenChange={vi.fn()} />);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it("validates title and description before submitting", async () => {
    render(<FeedbackComposerModal open onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /send feedback/i }));

    await waitFor(() =>
      expect(screen.getByText(/Give your feedback a short title/i)).toBeInTheDocument()
    );
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("submits successfully and shows the thank-you state", async () => {
    render(<FeedbackComposerModal open onOpenChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "Offline mode" },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "I want a lightweight offline mode for saved itineraries." },
    });
    fireEvent.click(screen.getByRole("button", { name: /send feedback/i }));

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));
    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "feature_request",
        title: "Offline mode",
        description: "I want a lightweight offline mode for saved itineraries.",
        sourceRoute: "/home",
        tripId: null,
      })
    );
    expect(await screen.findByText(/Thank you for shaping Travel Pro/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View your feedback/i })).toHaveAttribute(
      "href",
      "/feedback"
    );
  });
});
