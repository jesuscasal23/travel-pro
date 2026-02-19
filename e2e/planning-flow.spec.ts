// ============================================================
// E2E-01: Full Planning Flow
//
// Scenario: User visits landing page, completes onboarding,
// fills out the 6-step plan questionnaire, clicks Generate,
// waits for the generation animation (~18 s), and lands on
// the trip detail page.
//
// Important implementation detail: the plan page does NOT
// call /api/generate — generation is a client-side animation
// only. The route is hardcoded to /trip/japan-vietnam-thailand-2026.
//
// Test timeout: 60 s (generation animation takes ~18 s).
// ============================================================

import { test, expect } from "@playwright/test";

// Clear persisted Zustand state before each test so we always
// start from the known default store values.
test.beforeEach(async ({ page }) => {
  // Navigate to the app once to get a page context, then wipe localStorage
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

// ── E2E-01: Landing → Onboarding → Plan → Generate → Trip ────────────────────

test("E2E-01: completes full planning flow from landing to trip detail", async ({ page }) => {
  // ── 1. Landing page ───────────────────────────────────────────────────────
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // Click the primary CTA — any button linking to /onboarding
  await page.getByRole("link", { name: /start planning|get started|plan your trip/i }).first().click();
  await page.waitForURL("**/onboarding");

  // ── 2. Onboarding — Step 1 (Nationality + Airport) ───────────────────────
  await expect(page.getByText("Where are you from?")).toBeVisible();

  // Nationality select: choose German (first option in the list, also the default)
  await page.getByLabel("Nationality").selectOption("German");

  // Home airport: use the default (LEJ – Leipzig/Halle is the store default)
  // No change needed — just proceed.

  // Click "Continue"
  await page.getByRole("button", { name: "Continue" }).click();

  // ── 3. Onboarding — Step 2 (Travel Style + Interests) ────────────────────
  await expect(page.getByText("Tell us about yourself")).toBeVisible();

  // Select "Comfort" travel style (it's the default but clicking ensures it's active)
  await page.getByRole("button", { name: /comfort/i }).click();

  // Select one interest chip
  await page.getByRole("button", { name: /Culture & History/i }).click();

  // Click "Get Started" to navigate to /plan
  await page.getByRole("button", { name: "Get Started" }).click();
  await page.waitForURL("**/plan");

  // ── 4. Plan — Step 1: Region ──────────────────────────────────────────────
  await expect(page.getByText("Where do you want to go?")).toBeVisible();

  // Click "Southeast Asia" (first popular region in the list)
  await page.getByRole("button", { name: /Southeast Asia/i }).click();

  // Confirm the region button is now visually selected (border-primary class)
  await expect(page.getByRole("button", { name: /Southeast Asia/i })).toHaveClass(/border-primary/);

  await page.getByRole("button", { name: "Continue" }).click();

  // ── 5. Plan — Step 2: Dates ───────────────────────────────────────────────
  await expect(page.getByText("How long is your trip?")).toBeVisible();

  await page.getByLabel("Start date").fill("2026-04-01");
  await page.getByLabel("End date").fill("2026-04-22");

  // Day count summary should appear
  await expect(page.getByText("21 days")).toBeVisible();

  await page.getByRole("button", { name: "Continue" }).click();

  // ── 6. Plan — Step 3: Budget ──────────────────────────────────────────────
  await expect(page.getByText("What's your budget?")).toBeVisible();

  // Default budget is €10,000 — slider already has a valid value > 0
  await expect(page.getByText(/€10,000|€10\.000/)).toBeVisible();

  await page.getByRole("button", { name: "Continue" }).click();

  // ── 7. Plan — Step 4: Travelers ───────────────────────────────────────────
  await expect(page.getByText("How many travelers?")).toBeVisible();

  // Default is 2 travelers — already valid, just proceed
  await expect(page.getByText("2")).toBeVisible();

  await page.getByRole("button", { name: "Continue" }).click();

  // ── 9. Plan — Step 6: Summary + Generate ─────────────────────────────────
  await expect(page.getByText("Your trip summary")).toBeVisible();

  // The summary card should reflect our choices
  await expect(page.getByText("Southeast Asia")).toBeVisible();
  await expect(page.getByText(/21 days/)).toBeVisible();

  // Click Generate — this starts the ~18 s animation sequence
  await page.getByRole("button", { name: /Generate My Itinerary/i }).click();

  // ── 10. Generation loading screen ────────────────────────────────────────
  await expect(page.getByText("Creating your itinerary")).toBeVisible();

  // The first generation step should appear
  await expect(page.getByText("Generating your route...")).toBeVisible();

  // ── 11. Trip detail page ─────────────────────────────────────────────────
  // Wait up to 35 s for the animation to finish and navigation to occur.
  // (5 steps × 3500 ms + 600 ms delay = ~18 100 ms real time)
  await page.waitForURL("**/trip/japan-vietnam-thailand-2026", { timeout: 35_000 });

  // Verify we landed on the trip page with some key content
  await expect(page).toHaveURL(/trip\/japan-vietnam-thailand-2026/);
  await expect(page.getByText(/Japan|Vietnam|Thailand/i).first()).toBeVisible();
});

// ── E2E-01b: Smoke — skip onboarding via "Skip for now" ──────────────────────

test("E2E-01b: can reach /plan by skipping onboarding", async ({ page }) => {
  await page.goto("/onboarding");

  await expect(page.getByText("Where are you from?")).toBeVisible();

  // Use the skip link
  await page.getByRole("button", { name: /skip for now/i }).click();

  await page.waitForURL("**/plan");
  await expect(page.getByText("Where do you want to go?")).toBeVisible();
});

// ── E2E-01c: Navigation guard — Continue disabled until region selected ───────

test("E2E-01c: Continue button is disabled on step 1 until a region is selected", async ({ page }) => {
  await page.goto("/plan");

  // Reset store so no region is pre-selected
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.getByText("Where do you want to go?")).toBeVisible();

  const continueBtn = page.getByRole("button", { name: "Continue" });

  // With no region selected the button should be disabled
  await expect(continueBtn).toBeDisabled();

  // After selecting a region it should become enabled
  await page.getByRole("button", { name: /Southeast Asia/i }).click();
  await expect(continueBtn).toBeEnabled();
});

// ── E2E-01d: Date validation — Continue disabled without valid date range ─────

test("E2E-01d: Continue on step 2 is disabled until both dates are set", async ({ page }) => {
  await page.goto("/plan");

  // Pre-select a region so we can advance to step 2
  await page.evaluate(() => {
    localStorage.setItem(
      "travel-pro-store",
      JSON.stringify({
        state: { region: "southeast-asia", planStep: 2, budget: 10000, travelers: 2 },
        version: 0,
      })
    );
  });
  await page.reload();

  await expect(page.getByText("How long is your trip?")).toBeVisible();

  const continueBtn = page.getByRole("button", { name: "Continue" });

  // No dates → disabled
  await expect(continueBtn).toBeDisabled();

  // Only start date → still disabled
  await page.getByLabel("Start date").fill("2026-04-01");
  await expect(continueBtn).toBeDisabled();

  // Both dates set → enabled
  await page.getByLabel("End date").fill("2026-04-22");
  await expect(continueBtn).toBeEnabled();
});
