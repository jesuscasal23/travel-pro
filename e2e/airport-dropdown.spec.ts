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

test("airport dropdown is visible and selectable in the planner profile step", async ({ page }) => {
  await page.goto("/plan");
  await expect(page.getByText("Where are you headed?")).toBeVisible();

  await page.getByPlaceholder("Search for a city").fill("Paris");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: /Next/i }).click();

  await expect(page.getByText("When are you going?")).toBeVisible();
  await page.locator('input[type="date"]').first().fill("2026-10-01");
  await page.locator('input[type="date"]').nth(1).fill("2026-10-08");
  await page.getByRole("button", { name: /Next/i }).click();

  await expect(page.getByText("What level of trip are you after?")).toBeVisible();
  await page.getByRole("button", { name: /Comfort/i }).click();
  await page.getByRole("button", { name: /Next/i }).click();

  await expect(page.getByText("What should fill the trip?")).toBeVisible();
  await page.getByRole("button", { name: /Balanced/i }).click();
  await page.getByRole("button", { name: /Culture/i }).click();
  await page.getByRole("button", { name: /Next/i }).click();

  await expect(page.getByText("Tell us a bit about you")).toBeVisible();
  await page.locator("select").selectOption("Germany");

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
