import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryWrapper, mockNextLink } from "@/__tests__/mocks";

const mockRouterReplace = vi.fn();
const mockSignUp = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
  useSearchParams: () => ({
    get: (key: string) => (key === "next" ? "/plan" : null),
  }),
}));

vi.mock("next/link", () => mockNextLink());

vi.mock("@/components/auth/GoogleAuthButton", () => ({
  GoogleAuthButton: () => React.createElement("div", null, "Google Button"),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signUp: mockSignUp,
    },
  }),
}));

import SignupPage from "@/app/(auth)/signup/page";

describe("SignupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows confirmation instructions instead of redirecting when sign-up has no session", async () => {
    mockSignUp.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(<SignupPage />, { wrapper: createTestQueryWrapper() });

    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: "traveler@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/at least 8 characters/i), {
      target: { value: "Password1" },
    });
    fireEvent.change(screen.getByPlaceholderText(/repeat your password/i), {
      target: { value: "Password1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(screen.getByText(/check your email/i)).toBeInTheDocument());

    expect(
      screen.getByText(/we sent a confirmation link to traveler@example.com/i)
    ).toBeInTheDocument();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });
});
