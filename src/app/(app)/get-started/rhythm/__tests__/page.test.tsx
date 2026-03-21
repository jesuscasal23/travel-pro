import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RhythmPage from "@/app/(app)/get-started/rhythm/page";
import { useTripStore } from "@/stores/useTripStore";

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

describe("RhythmPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTripStore.setState({ pace: "moderate" });
  });

  it("always continues to plan without showing an auth checkpoint", () => {
    render(<RhythmPage />);

    expect(screen.getByRole("button", { name: /^continue$/i })).toBeInTheDocument();
    expect(screen.queryByText(/create account to continue/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/already have an account\\? sign in/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    expect(mockRouterPush).toHaveBeenCalledWith("/plan");
  });
});
