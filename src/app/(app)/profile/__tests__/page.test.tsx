import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

vi.mock("@/hooks/api", () => ({
  useAuthStatus: () => true,
  useDeleteAccount: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useExportData: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSaveProfile: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useTravelerPreferences: () => ({
    hasServerProfile: true,
    isLoading: false,
    data: {
      nationality: "German",
      homeAirport: "FRA - Frankfurt Airport (Frankfurt, DE)",
      travelStyle: "smart-budget",
      interests: ["food"],
      pace: "moderate",
      vibes: undefined,
    },
  }),
}));

vi.mock("@/components/ui/AppScreen", () => ({
  AppScreen: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/ConfirmDialog", () => ({
  ConfirmDialog: () => null,
}));

vi.mock("@/components/feedback/FeedbackComposerModal", () => ({
  FeedbackComposerModal: () => null,
}));

vi.mock("@/lib/core/supabase-client", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: { email: "traveler@example.com", user_metadata: { full_name: "Traveler" } } },
      }),
      signOut: vi.fn(),
    },
  }),
}));

import ProfilePage from "../page";

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the founding-user feedback access point", async () => {
    render(<ProfilePage />);

    expect(await screen.findByText(/Shape what we build next/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Share feedback/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /View your feedback/i })).toBeInTheDocument();
  });
});
