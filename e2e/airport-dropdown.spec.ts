// ============================================================
// E2E: Airport combobox dropdown visibility
//
// Regression test: the dropdown must not be clipped by parent
// overflow styles.
// ============================================================

import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("airport dropdown is visible and selectable on onboarding", async ({ page }) => {
  await page.goto("/onboarding/about-you");
  await expect(page.getByText("Where are you from?")).toBeVisible();

  // Focus the airport input and type a query
  const input = page.getByPlaceholder("Search airport or city…");
  await input.click();
  await input.fill("Frank");

  // The dropdown list should appear and not be clipped
  const dropdown = page.locator("ul.absolute.z-50");
  await expect(dropdown).toBeVisible();

  // Verify at least one result is visible
  const firstOption = dropdown.locator("li").first();
  await expect(firstOption).toBeVisible();

  // Click the first option — it should populate the display
  const optionText = await firstOption.locator("span.font-mono").textContent();
  await firstOption.click();
  await expect(page.getByText(new RegExp(optionText!))).toBeVisible();
});
