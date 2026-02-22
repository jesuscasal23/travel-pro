// ============================================================
// E2E tests for Inline Edit Mode (Phase 2 feature)
//
// Journey 1 (E2E-IE-01): Guest trip — enter edit mode → edit activity → undo → save
// Journey 2 (E2E-IE-02): Guest trip — enter edit mode → add manual activity → save
// Journey 3 (E2E-IE-03): Guest trip — open route sheet → change days → close
// Journey 4 (E2E-IE-04): Guest trip — enter edit mode → discard → verify no changes
// Journey 5 (E2E-IE-05): /trip/:id/edit redirects to /trip/:id
//
// All journeys use the guest (no auth required) flow:
//   /plan → complete questionnaire → wait for generation → /trip/:id
//
// Test timeout: 90s (generation can take up to 60s).
// ============================================================

import { test, expect, type Page } from "@playwright/test";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Navigate to plan, fill out a minimal trip questionnaire, and wait for the trip page. */
async function generateGuestTrip(page: Page): Promise<string> {
  await page.goto("/plan");

  // Step 1: destination / trip type
  // Select a quick single-city trip if prompted
  const singleCity = page.getByRole("button", { name: /single.?city|one city/i });
  if (await singleCity.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await singleCity.click();
  }

  // Fill destination if there's a text input (handles both combobox and free text)
  const destInput = page.getByPlaceholder(/destination|where/i).first();
  if (await destInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await destInput.fill("Tokyo");
    // Select first autocomplete suggestion if it appears
    const suggestion = page.getByRole("option").first();
    if (await suggestion.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await suggestion.click();
    }
  }

  // Advance through the wizard steps using Continue buttons
  for (let i = 0; i < 6; i++) {
    const continueBtn = page.getByRole("button", { name: /continue|next|generate/i }).first();
    if (await continueBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await continueBtn.click();
    }
  }

  // Wait for navigation to /trip/:id (generation complete)
  await page.waitForURL(/\/trip\/[^/]+$/, { timeout: 90_000 });

  // Wait for the page to settle (no skeleton visible)
  await expect(page.getByText(/your dream trip|itinerary/i).first()).toBeVisible({ timeout: 30_000 });

  return page.url();
}

/** Enter edit mode by clicking the "Edit trip" button in the hero. */
async function enterEditMode(page: Page) {
  const editBtn = page.getByRole("button", { name: /edit trip/i }).first();
  await expect(editBtn).toBeVisible({ timeout: 10_000 });
  await editBtn.click();
  // Edit mode banner should appear
  await expect(page.getByText(/editing/i)).toBeVisible({ timeout: 5_000 });
}

// ── E2E-IE-01: Enter edit mode, edit activity, undo, save ─────────────────────

test("E2E-IE-01: guest — enter edit mode → verify banner and toolbar", async ({ page }) => {
  await generateGuestTrip(page);

  // Enter edit mode
  await enterEditMode(page);

  // Edit mode banner is visible
  await expect(page.getByText(/editing/i)).toBeVisible();

  // Save / Discard buttons visible in the toolbar
  await expect(page.getByRole("button", { name: /save/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /discard/i }).first()).toBeVisible();
});

// ── E2E-IE-02: Discard reverts to view mode ────────────────────────────────────

test("E2E-IE-02: guest — enter edit mode → discard → returns to view mode", async ({ page }) => {
  await generateGuestTrip(page);

  await enterEditMode(page);
  await expect(page.getByText(/editing/i)).toBeVisible();

  // Click discard
  const discardBtn = page.getByRole("button", { name: /discard/i }).first();
  await discardBtn.click();

  // Edit banner should be gone
  await expect(page.getByText(/editing/i)).not.toBeVisible({ timeout: 5_000 });

  // "Edit trip" button should be back
  await expect(page.getByRole("button", { name: /edit trip/i }).first()).toBeVisible();
});

// ── E2E-IE-03: Add manual activity ────────────────────────────────────────────

test("E2E-IE-03: guest — enter edit mode → add manual activity → save", async ({ page }) => {
  await generateGuestTrip(page);
  await enterEditMode(page);

  // Find and click an "Add activity" button
  const addBtn = page.getByRole("button", { name: /add activity/i }).first();
  await expect(addBtn).toBeVisible({ timeout: 10_000 });
  await addBtn.click();

  // Menu should appear with "Add manually"
  await expect(page.getByText("Add manually")).toBeVisible();
  await page.getByText("Add manually").click();

  // An "Unnamed activity" card should appear (new empty activity expanded)
  await expect(page.getByText("Unnamed activity")).toBeVisible({ timeout: 5_000 });

  // Fill in the name field
  const nameInput = page.getByPlaceholder("Activity name").first();
  await nameInput.fill("Visit Imperial Palace");
  await nameInput.blur();

  // Fill duration
  const durInput = page.getByPlaceholder("e.g. 2 hours").first();
  await durInput.fill("2 hours");
  await durInput.blur();

  // Click Done to collapse the form
  await page.getByRole("button", { name: /done/i }).first().click();

  // The new activity should be visible
  await expect(page.getByText("Visit Imperial Palace")).toBeVisible();

  // Save should be enabled (undoStack.length > 0 → hasChanges)
  const saveBtn = page.getByRole("button", { name: /save/i }).first();
  await expect(saveBtn).not.toBeDisabled();
  await saveBtn.click();

  // After save, edit mode should be exited
  await expect(page.getByText(/editing/i)).not.toBeVisible({ timeout: 5_000 });
});

// ── E2E-IE-04: Undo after adding activity ─────────────────────────────────────

test("E2E-IE-04: guest — add activity → undo → activity removed", async ({ page }) => {
  await generateGuestTrip(page);
  await enterEditMode(page);

  // Add a manual activity
  const addBtn = page.getByRole("button", { name: /add activity/i }).first();
  await addBtn.click();
  await page.getByText("Add manually").click();

  // Fill name and blur so it commits
  const nameInput = page.getByPlaceholder("Activity name").first();
  await nameInput.fill("Test Activity XYZ");
  await nameInput.blur();

  // Collapse form
  await page.getByRole("button", { name: /done/i }).first().click();
  await expect(page.getByText("Test Activity XYZ")).toBeVisible();

  // Click Undo
  const undoBtn = page.getByRole("button", { name: /undo/i }).first();
  await undoBtn.click();

  // The activity should be gone (undo reverted the add)
  await expect(page.getByText("Test Activity XYZ")).not.toBeVisible({ timeout: 5_000 });
});

// ── E2E-IE-05: /trip/:id/edit redirects to /trip/:id ──────────────────────────

test("E2E-IE-05: /trip/:id/edit redirects to /trip/:id", async ({ page }) => {
  // Navigate to the plan flow and generate a trip to get a valid trip ID
  const tripUrl = await generateGuestTrip(page);

  // Append /edit to the trip URL
  const editUrl = tripUrl.replace(/\/?$/, "/edit");
  await page.goto(editUrl);

  // Should redirect to the base trip URL (no /edit suffix)
  await page.waitForURL(/\/trip\/[^/]+$/, { timeout: 15_000 });
  expect(page.url()).not.toMatch(/\/edit/);
});

// ── E2E-IE-06: Route sheet opens when "Edit Route" clicked ────────────────────

test("E2E-IE-06: guest — enter edit mode → open route sheet → city list visible", async ({ page }) => {
  await generateGuestTrip(page);
  await enterEditMode(page);

  // In edit mode, the hero shows "Edit Route" button
  const editRouteBtn = page.getByRole("button", { name: /edit route/i }).first();
  await expect(editRouteBtn).toBeVisible({ timeout: 5_000 });
  await editRouteBtn.click();

  // Route sheet should show at least one city card (with day stepper buttons)
  await expect(page.getByRole("button", { name: /increase days/i }).first()).toBeVisible({ timeout: 5_000 });
});
