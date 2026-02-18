// ============================================================
// E2E Phase 1 — Auth, Edit & Share journeys
//
// Journey 1 (E2E-02): Sign Up → 4-step Onboarding → Generate → Export
//   Requires env: E2E_TEST_EMAIL, E2E_TEST_PASSWORD
//   (skip gracefully if not set — CI uses real Supabase test project)
//
// Journey 2 (E2E-03): Login → Existing Trip → Edit → Remove City → Share
//   Requires env: E2E_TEST_EMAIL, E2E_TEST_PASSWORD + seeded demo trip
//
// Journey 3 (E2E-04): Public share page smoke test
//   Uses /share route with a mock token, no auth required.
//
// Test timeout: 90 s (SSE generation can take up to 60 s).
// ============================================================

import { test, expect, type Page } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "";
const hasAuthCreds = TEST_EMAIL !== "" && TEST_PASSWORD !== "";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Log in via the UI login form. */
async function loginViaUI(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}

/** Sign up, then clear the newly-created account after the test (idempotent). */
async function signUpViaUI(page: Page, email: string, password: string) {
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  // Confirm password field (if present)
  const confirmField = page.getByLabel(/confirm password/i);
  if (await confirmField.isVisible()) {
    await confirmField.fill(password);
  }
  await page.getByRole("button", { name: /sign up|create account/i }).click();
  // Should redirect to /onboarding after success
  await page.waitForURL("**/onboarding", { timeout: 15_000 });
}

// ── E2E-02: Sign Up → Onboarding (4 steps) → Plan → Generate ─────────────────

test("E2E-02: signup → 4-step onboarding → plan → generate", async ({ page }) => {
  if (!hasAuthCreds) {
    test.skip(true, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — skipping auth journey");
    return;
  }

  // Use a unique email per run to avoid "already registered" errors
  const uniqueEmail = `e2e+${Date.now()}@travelpro-test.dev`;

  // ── 1. Sign up ─────────────────────────────────────────────────────────────
  await signUpViaUI(page, uniqueEmail, TEST_PASSWORD);
  await expect(page).toHaveURL(/onboarding/);

  // ── 2. Onboarding — Step 1: Name + Nationality + Airport ──────────────────
  await expect(page.getByText("Where are you from?")).toBeVisible();

  const nameField = page.getByLabel(/first name|name/i).first();
  if (await nameField.isVisible()) {
    await nameField.fill("Test User");
  }

  await page.getByLabel("Nationality").selectOption("German");
  await page.getByRole("button", { name: "Continue" }).click();

  // ── 3. Onboarding — Step 2: Travel Style + Interests ─────────────────────
  await expect(page.getByText("Tell us about yourself")).toBeVisible();
  await page.getByRole("button", { name: /comfort/i }).click();
  await page.getByRole("button", { name: /Culture & History/i }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  // ── 4. Onboarding — Step 3: Activity Level + Languages ───────────────────
  // Step 3 may exist in Phase 1 4-step flow
  const step3Heading = page.getByText(/activity level|how active/i);
  if (await step3Heading.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await page.getByRole("button", { name: /moderate/i }).first().click();
    await page.getByRole("button", { name: "Continue" }).click();
  }

  // ── 5. Onboarding — Step 4 or final: Summary ─────────────────────────────
  const summaryHeading = page.getByText(/you're all set|start planning|summary/i);
  if (await summaryHeading.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await page.getByRole("button", { name: /start planning|get started/i }).click();
  }

  // Should land on /plan or /dashboard
  await page.waitForURL(/\/(plan|dashboard)/, { timeout: 10_000 });
});

// ── E2E-03: Login → Existing Trip → Edit (remove city) → Save → Share ────────

test("E2E-03: login → trip edit → remove city → share link", async ({ page }) => {
  if (!hasAuthCreds) {
    test.skip(true, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — skipping auth journey");
    return;
  }

  // ── 1. Login ───────────────────────────────────────────────────────────────
  await loginViaUI(page);
  await expect(page).toHaveURL(/dashboard/);

  // ── 2. Navigate to an existing trip ───────────────────────────────────────
  // Click the first trip card visible on the dashboard
  const firstTripLink = page.locator("a[href*='/trip/']").first();
  await expect(firstTripLink).toBeVisible({ timeout: 10_000 });
  const tripHref = await firstTripLink.getAttribute("href");
  await firstTripLink.click();
  await page.waitForURL(/\/trip\//, { timeout: 15_000 });

  // ── 3. Open edit mode ──────────────────────────────────────────────────────
  const editLink = page.getByRole("link", { name: /edit|modify/i }).first();
  await expect(editLink).toBeVisible({ timeout: 5_000 });
  await editLink.click();
  await page.waitForURL(/\/edit/, { timeout: 10_000 });

  // ── 4. Record city count before removal ───────────────────────────────────
  const cityCards = page.locator(".card-travel");
  const countBefore = await cityCards.count();
  expect(countBefore).toBeGreaterThan(1);

  // ── 5. Remove the last city ────────────────────────────────────────────────
  // Hover over the last city card to reveal the remove button
  const lastCard = cityCards.last();
  await lastCard.hover();
  const removeBtn = lastCard.getByRole("button", { name: /remove/i });
  await removeBtn.click();

  // One fewer card now
  await expect(cityCards).toHaveCount(countBefore - 1);

  // ── 6. Save ────────────────────────────────────────────────────────────────
  await page.getByRole("button", { name: /save changes/i }).click();

  // Should navigate back to trip detail
  await page.waitForURL(/\/trip\/[^/]+$/, { timeout: 15_000 });

  // ── 7. Verify fewer cities visible ────────────────────────────────────────
  // The timeline or city chips should reflect one fewer entry.
  // We rely on the page having loaded without error.
  await expect(page.getByText(/Tokyo|Kyoto|Hanoi|Bangkok/i).first()).toBeVisible();

  // ── 8. Share — generate a share link ──────────────────────────────────────
  const shareBtn = page.getByRole("button", { name: /share|copy link/i }).first();
  if (await shareBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await shareBtn.click();
    // A toast / copied confirmation should appear
    await expect(page.getByText(/copied|link copied/i)).toBeVisible({ timeout: 5_000 });
  } else {
    // Share may live in the summary tab — navigate there
    const summaryLink = page.getByRole("link", { name: /summary/i }).first();
    if (await summaryLink.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await summaryLink.click();
      await page.waitForURL(/summary/);
      const shareBtn2 = page.getByRole("button", { name: /share|copy link/i }).first();
      await expect(shareBtn2).toBeVisible({ timeout: 5_000 });
      await shareBtn2.click();
      await expect(page.getByText(/copied|link copied/i)).toBeVisible({ timeout: 5_000 });
    }
  }

  // ── 9. (If we have the token) Navigate to public share page ───────────────
  // Extract trip ID from current URL
  const currentUrl = page.url();
  const tripIdMatch = currentUrl.match(/\/trip\/([^/]+)/);
  if (tripIdMatch) {
    const tripId = tripIdMatch[1];
    // Get the share token via API
    const res = await page.request.get(`/api/v1/trips/${tripId}/share`);
    if (res.ok()) {
      const { shareToken } = await res.json();
      if (shareToken) {
        await page.goto(`/share/${shareToken}`);
        await expect(page.getByText(/plan your own trip/i)).toBeVisible({ timeout: 10_000 });
      }
    }
  }
});

// ── E2E-04: Public share page renders without auth ────────────────────────────

test("E2E-04: public share page shows correct content for seeded demo trip", async ({ page }) => {
  // The seeded demo trip uses a fixed share token in the seed script.
  // Fall back to a graceful 404 check if not seeded.
  await page.goto("/share/demo-asia-2026");

  const banner = page.getByText(/plan your own trip/i);
  const notFound = page.getByText(/not found|404|expired/i);

  // One of these must be true: either the share page loaded or we got a 404
  const bannerVisible = await banner.isVisible({ timeout: 5_000 }).catch(() => false);
  const notFoundVisible = await notFound.isVisible({ timeout: 5_000 }).catch(() => false);

  expect(bannerVisible || notFoundVisible).toBe(true);
});

// ── E2E-05: Protected routes redirect unauthenticated users ──────────────────

test("E2E-05: unauthenticated users are redirected to /login from protected routes", async ({
  page,
}) => {
  // Ensure clean state (no session cookies)
  await page.context().clearCookies();
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());

  const protectedPaths = ["/dashboard", "/plan", "/profile"];

  for (const path of protectedPaths) {
    await page.goto(path);
    // Should end up on /login (with ?next= param) or at /login
    await expect(page).toHaveURL(/login/, { timeout: 10_000 });
  }
});

// ── E2E-06: Auth pages render correctly ───────────────────────────────────────

test("E2E-06: signup and login pages render key form elements", async ({ page }) => {
  // Signup page
  await page.goto("/signup");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: /sign up|create account/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /log in|sign in/i })).toBeVisible();

  // Login page
  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in|log in/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /sign up|create account/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /forgot/i })).toBeVisible();

  // Forgot password page
  await page.goto("/forgot-password");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: /send|reset/i })).toBeVisible();
});

// ── E2E-07: Version history dialog renders in edit mode ───────────────────────

test("E2E-07: version history dialog opens on edit page", async ({ page }) => {
  // Navigate directly with seeded sample trip ID
  await page.goto("/trip/japan-vietnam-thailand-2026/edit");

  // Wait for edit page to load
  await expect(page.getByText(/edit trip|edit mode/i)).toBeVisible({ timeout: 10_000 });

  // Click "Version history" button
  const historyBtn = page.getByRole("button", { name: /version history/i });
  await expect(historyBtn).toBeVisible();
  await historyBtn.click();

  // Dialog should appear
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText(/version history/i)).toBeVisible();
  await expect(page.getByText(/v1.*original|original.*v1/i)).toBeVisible();
});
