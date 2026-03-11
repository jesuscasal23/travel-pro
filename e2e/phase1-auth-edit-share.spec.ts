import { test, expect, type Page } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "";
const hasAuthCreds = TEST_EMAIL !== "" && TEST_PASSWORD !== "";

async function loginViaUI(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/Email address/i).fill(TEST_EMAIL);
  await page.getByLabel(/Password/i).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL("**/trips", { timeout: 15_000 });
}

async function signUpViaUI(page: Page, email: string, password: string) {
  await page.goto("/signup");
  await page.getByLabel(/Email address/i).fill(email);
  await page.getByLabel(/^Password$/i).fill(password);

  const confirmField = page.getByLabel(/confirm password/i);
  if (await confirmField.isVisible().catch(() => false)) {
    await confirmField.fill(password);
  }

  await page.getByRole("button", { name: /sign up|create account/i }).click();
  await page.waitForURL("**/trips", { timeout: 15_000 });
}

test("E2E-02: signup -> trips -> planner", async ({ page }) => {
  if (!hasAuthCreds) {
    test.skip(true, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set - skipping auth journey");
    return;
  }

  const uniqueEmail = `e2e+${Date.now()}@travelpro-test.dev`;

  await signUpViaUI(page, uniqueEmail, TEST_PASSWORD);
  await expect(page).toHaveURL(/trips/);

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
  await page.getByPlaceholder(/Search airport or city/i).fill("FRA");
  await page.keyboard.press("Enter");
});

test("E2E-03: login -> trip edit -> route change -> save -> share", async ({ page }) => {
  if (!hasAuthCreds) {
    test.skip(true, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set - skipping auth journey");
    return;
  }

  await loginViaUI(page);
  await expect(page).toHaveURL(/trips/);

  const firstTripLink = page.locator("a[href*='/trip/']").first();
  await expect(firstTripLink).toBeVisible({ timeout: 10_000 });
  await firstTripLink.click();
  await page.waitForURL(/\/trip\//, { timeout: 15_000 });

  const editTripBtn = page.getByRole("button", { name: /Edit trip/i }).first();
  await expect(editTripBtn).toBeVisible({ timeout: 10_000 });
  await editTripBtn.click();
  await expect(page.getByText(/Editing/i)).toBeVisible({ timeout: 5_000 });

  const editRouteBtn = page.getByRole("button", { name: /Edit Route/i }).first();
  await expect(editRouteBtn).toBeVisible({ timeout: 5_000 });
  await editRouteBtn.click();

  const removeButtons = page.getByRole("button", { name: /Remove /i });
  const countBefore = await removeButtons.count();
  if (countBefore > 1) {
    await removeButtons.last().click();
    await expect(removeButtons).toHaveCount(countBefore - 1);
  }

  await page.getByRole("button", { name: /Done/i }).first().click();
  await page.getByRole("button", { name: /Save/i }).first().click();
  await expect(page.getByText(/Editing/i)).not.toBeVisible({ timeout: 10_000 });

  const summaryLink = page.getByRole("link", { name: /Summary/i }).first();
  if (await summaryLink.isVisible().catch(() => false)) {
    await summaryLink.click();
    await page.waitForURL(/summary/, { timeout: 10_000 });
  }

  const shareBtn = page.getByRole("button", { name: /share|copy link/i }).first();
  if (await shareBtn.isVisible().catch(() => false)) {
    await shareBtn.click();
    await expect(page.getByText(/copied|link copied/i)).toBeVisible({ timeout: 5_000 });
  }
});

test("E2E-06: auth pages render key form elements", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  await expect(page.getByPlaceholder("At least 8 characters")).toBeVisible();
  await expect(page.getByRole("button", { name: /sign up|create account/i })).toBeVisible();
  await expect(page.locator('a[href^="/login"]').last()).toBeVisible();

  await page.goto("/login");
  await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  await expect(page.getByPlaceholder("Your password")).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in|log in/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /sign up|create account/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /forgot password/i })).toBeVisible();

  await page.goto("/forgot-password");
  await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  await expect(page.getByRole("button", { name: /send reset link|send|reset/i })).toBeVisible();
});
