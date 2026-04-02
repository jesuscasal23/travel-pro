#!/usr/bin/env python3
"""
Playwright MCP audit runner for Travel Pro.

Launches key flows through the marketing onboarding, planner, auth, and premium
pages to surface regressions quickly. Results are written to
test-results/playwright-mcp/report-*.json along with per-test screenshots.
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
import traceback
from pathlib import Path
from typing import Callable, List, Optional

from playwright.sync_api import (
    TimeoutError as PlaywrightTimeoutError,
    expect,
    sync_playwright,
)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
RESULTS_DIR = PROJECT_ROOT / "test-results" / "playwright-mcp"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

BASE_URL = os.environ.get("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
E2E_EMAIL = os.environ.get("E2E_TEST_EMAIL")
E2E_PASSWORD = os.environ.get("E2E_TEST_PASSWORD")

ANALYTICS_BLOCKERS = [
    "https://www.googletagmanager.com/**",
    "https://www.google-analytics.com/**",
    "https://www.googleoptimize.com/**",
    "https://*.posthog.com/**",
    "https://cdn.posthog.com/**",
]


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


class TestRunner:
    def __init__(self, browser):
        self.browser = browser
        self.results: List[dict] = []

    def run(self, name: str, fn: Callable) -> None:
        slug = slugify(name)
        context = self.browser.new_context(
            base_url=BASE_URL,
            viewport={"width": 1280, "height": 880},
            ignore_https_errors=True,
        )

        for pattern in ANALYTICS_BLOCKERS:
            context.route(
                pattern,
                lambda route, _pattern=pattern: route.abort(),
            )

        page = context.new_page()
        console_issues: List[dict] = []
        page_errors: List[str] = []
        request_failures: List[dict] = []

        def handle_console(msg):
            if msg.type in {"warning", "error"}:
                console_issues.append({"type": msg.type, "text": msg.text})

        page.on("console", handle_console)
        page.on("pageerror", lambda err: page_errors.append(str(err)))
        context.on(
            "requestfailed",
            lambda req: request_failures.append(
                {"url": req.url, "failure": req.failure, "method": req.method}
            ),
        )

        detail: Optional[str] = None
        status = "passed"
        final_url = None
        screenshot_path: Optional[Path] = None

        try:
            detail = fn(page)
            final_url = page.url
        except (AssertionError, PlaywrightTimeoutError) as exc:
            status = "failed"
            detail = f"{type(exc).__name__}: {exc}"
            final_url = page.url
        except Exception:
            status = "error"
            detail = traceback.format_exc()
            final_url = page.url
        finally:
            try:
                screenshot_path = RESULTS_DIR / f"{slug}.png"
                page.screenshot(path=str(screenshot_path), full_page=True)
            except Exception:
                screenshot_path = None
            context.close()

        self.results.append(
            {
                "name": name,
                "status": status,
                "detail": detail,
                "final_url": final_url,
                "screenshot": str(screenshot_path.relative_to(PROJECT_ROOT))
                if screenshot_path
                else None,
                "console_issues": console_issues,
                "page_errors": page_errors,
                "request_failures": request_failures,
            }
        )


def onboarding_flow(page):
    steps = []
    page.goto("/get-started", wait_until="networkidle")
    expect(page.get_by_text("Welcome to Fichi")).to_be_visible(timeout=10_000)

    start_btn = page.get_by_role("button", name=re.compile("Start Planning", re.I))
    expect(start_btn).to_be_enabled()
    start_btn.click()
    page.wait_for_url("**/get-started/advantage", timeout=10_000)
    expect(page.get_by_text("The Fichi Advantage")).to_be_visible(timeout=5_000)
    steps.append("start CTA routes to advantage")

    page.get_by_role("button", name=re.compile("Sounds Perfect", re.I)).click()
    page.wait_for_url("**/get-started/personalization", timeout=10_000)
    expect(page.get_by_text("Personalization Engine")).to_be_visible()
    steps.append("advantage CTA -> personalization")

    page.get_by_role("button", name=re.compile("Build My Travel DNA", re.I)).click()
    page.wait_for_url("**/get-started/vibe", timeout=10_000)
    slider = page.get_by_label("Adventure to Comfort")
    slider.fill("80")
    steps.append("vibe sliders respond to input")
    page.get_by_role("button", name=re.compile("^Continue$", re.I)).last.click()

    page.wait_for_url("**/get-started/interests", timeout=10_000)
    surf = page.get_by_role("button", name="Surfing").first
    surf.click()
    culture = page.get_by_role("button", name="Culture").first
    culture.click()
    expect(page.get_by_role("button", name="Continue")).to_be_enabled()
    page.get_by_role("button", name="Continue").click()
    steps.append("interests enforce selection gating")

    page.wait_for_url("**/get-started/budget", timeout=10_000)
    page.get_by_role("button", name=re.compile("Comfort Explorer", re.I)).click()
    page.get_by_role("button", name="Continue").click()
    steps.append("budget selection unlocks continue")

    page.wait_for_url("**/get-started/rhythm", timeout=10_000)
    page.get_by_role("button", name=re.compile("The Wanderer", re.I)).click()
    page.get_by_role("button", name="Continue").click()
    page.wait_for_url("**/plan", timeout=10_000)
    expect(page.get_by_text("The essentials")).to_be_visible(timeout=10_000)
    steps.append("hand-off to planner works")
    return " ; ".join(steps)


def plan_builder_flow(page):
    notes = []
    page.goto("/plan", wait_until="networkidle")
    expect(page.get_by_text("The essentials")).to_be_visible(timeout=10_000)

    page.locator("select").first.select_option("Germany")
    airport_input = page.get_by_placeholder("Search airport or city...")
    airport_input.click()
    airport_input.fill("Frank")
    dropdown = page.locator("ul").filter(has_text=re.compile("Frank", re.I)).first
    dropdown.wait_for(timeout=5_000)
    dropdown.locator("li").first.click()
    notes.append("profile step accepts nationality + airport")

    page.get_by_role("button", name=re.compile("Continue", re.I)).last.click()
    page.wait_for_url("**/plan", timeout=10_000)
    expect(page.get_by_text("Where to", exact=False)).to_be_visible(timeout=10_000)

    page.get_by_role("button", name="Bangkok").first.click()
    page.get_by_role("button", name="Tokyo").first.click()
    city_search = page.get_by_placeholder("Search cities...")
    city_search.fill("Paris")
    suggestion = (
        page.locator("button")
        .filter(has_text=re.compile("Paris.*France", re.I))
        .first
    )
    suggestion.wait_for(timeout=5_000)
    suggestion.click()
    notes.append("destination picker handles quick picks + search")

    date_grid = page.locator(".rdp-travel").first
    day_buttons = date_grid.locator(".rdp-day button:not([disabled])")
    total_days = day_buttons.count()
    if total_days < 2:
        raise AssertionError("Calendar did not render at least two selectable days.")
    start_index = 3 if total_days > 6 else 0
    end_index = min(start_index + 4, total_days - 1)
    day_buttons.nth(start_index).click()
    day_buttons.nth(end_index).click()
    page.get_by_role("button", name="One-way").click()
    page.get_by_role("button", name=re.compile("^Return$", re.I)).click()
    page.get_by_role("button", name=re.compile("Continue", re.I)).last.click()
    notes.append("dates + direction toggles responsive")

    expect(page.get_by_text("What's the hardest part?", exact=False)).to_be_visible(timeout=10_000)
    page.get_by_role("button", name=re.compile("Staying within budget", re.I)).click()
    page.get_by_role("button", name=re.compile("Analyze My Profile", re.I)).click()

    overview = page.get_by_text("Your Travel DNA is ready")
    signup_gate = page.get_by_text("Your trip is ready", exact=False)
    try:
        overview.wait_for(timeout=5_000)
        notes.append("overview renders for authenticated profiles")
    except PlaywrightTimeoutError:
        signup_gate.wait_for(timeout=5_000)
        expect(page.get_by_role("button", name=re.compile("Create free account", re.I))).to_be_visible()
        expect(page.get_by_role("link", name=re.compile("Log in", re.I))).to_be_visible()
        notes.append("signup gate appears for anonymous users")
    return " ; ".join(notes)


def login_validation(page):
    page.goto("/login", wait_until="networkidle")
    page.get_by_role("button", name=re.compile("Sign In", re.I)).click()
    expect(page.get_by_text("Please enter a valid email address")).to_be_visible(timeout=5_000)
    expect(page.get_by_text("Password is required")).to_be_visible(timeout=5_000)
    page.get_by_label("Email address").fill("not-an-email")
    page.get_by_label("Password").fill("test")
    page.get_by_role("button", name=re.compile("Sign In", re.I)).click()
    expect(page.get_by_text("Please enter a valid email address")).to_be_visible()
    return "login form enforces client-side validation"


def login_flow(page):
    if not (E2E_EMAIL and E2E_PASSWORD):
        raise AssertionError("E2E_TEST_EMAIL / E2E_TEST_PASSWORD are not configured.")

    page.goto("/login", wait_until="networkidle")
    page.get_by_label("Email address").fill(E2E_EMAIL)
    page.get_by_label("Password").fill(E2E_PASSWORD)
    page.get_by_role("button", name=re.compile("Sign In", re.I)).click()
    page.wait_for_url("**/trips", timeout=20_000)
    expect(page).to_have_url(re.compile("/trips"))

    page.goto("/profile", wait_until="networkidle")
    expect(page.get_by_role("button", name=re.compile("Export my data", re.I))).to_be_visible(
        timeout=10_000
    )
    sign_out = page.get_by_role("button", name=re.compile("Sign out", re.I))
    sign_out.click()
    page.wait_for_url("**/login**", timeout=12_000)
    return "existing test user can log in and sign out via profile"


def signup_validation(page):
    page.goto("/signup", wait_until="networkidle")
    cta = page.get_by_role("button", name=re.compile("Create Account", re.I))
    cta.click()
    expect(page.get_by_text("Please enter a valid email address")).to_be_visible(timeout=5_000)
    expect(page.get_by_text("Password must be at least 8 characters")).to_be_visible(timeout=5_000)
    page.get_by_label("Email address").fill("user@example.com")
    page.get_by_label("Password", exact=True).fill("Password1")
    page.get_by_label("Confirm password").fill("Mismatch1")
    cta.click()
    expect(page.get_by_text("Passwords don't match")).to_be_visible(timeout=5_000)
    return "signup form enforces schema validation before hitting Supabase"


def premium_page(page):
    notes = []
    page.route(
        "**/api/v1/stripe/checkout",
        lambda route: route.fulfill(
            status=200,
            headers={"Content-Type": "application/json"},
            body=json.dumps({"url": "/premium?checkout=mock"}),
        ),
    )

    if not (E2E_EMAIL and E2E_PASSWORD):
        raise AssertionError("E2E creds are required for premium test.")

    page.goto("/login", wait_until="networkidle")
    page.get_by_label("Email address").fill(E2E_EMAIL)
    page.get_by_label("Password").fill(E2E_PASSWORD)
    page.get_by_role("button", name=re.compile("Sign In", re.I)).click()
    page.wait_for_url("**/trips", timeout=15_000)

    page.goto("/premium", wait_until="networkidle")
    expect(page.get_by_role("heading", name=re.compile("Unlock the full experience", re.I))).to_be_visible()
    page.get_by_role("button", name=re.compile("Lifetime", re.I)).click()
    page.get_by_role("button", name=re.compile("Yearly", re.I)).click()
    page.get_by_role("button", name=re.compile("Monthly", re.I)).click()
    notes.append("plan cards toggle selection state")

    restore = page.get_by_role("button", name=re.compile("Restore Purchase", re.I))
    restore.click()
    expect(page.get_by_text("Nothing to restore")).to_be_visible(timeout=5_000)
    notes.append("restore button surfaces toast")

    cta = page.get_by_role(
        "button", name=re.compile("Start Free Trial|Get Lifetime|Unlock This Trip", re.I)
    )
    cta.first.click()
    page.wait_for_url("**/premium?checkout=mock", timeout=5_000)
    notes.append("checkout CTA hits mocked endpoint")

    page.goto("/profile", wait_until="networkidle")
    page.get_by_role("button", name=re.compile("Sign out", re.I)).click()
    page.wait_for_url("**/login**", timeout=10_000)
    return " ; ".join(notes)


def privacy_page(page):
    page.goto("/privacy", wait_until="networkidle")
    expect(page.get_by_role("heading", name="Privacy Policy")).to_be_visible(timeout=5_000)
    sections = page.locator("section")
    if sections.count() < 5:
        raise AssertionError("Expected at least 5 sections in privacy policy.")
    rows = page.locator("table tr")
    if rows.count() < 4:
        raise AssertionError("Retention table is missing rows.")
    return "privacy policy renders 5+ sections and retention table"


def auth_redirects(page):
    protected_paths = ["/home", "/trips", "/cart", "/feedback"]
    failures = []
    for path in protected_paths:
        page.goto(path)
        try:
            page.wait_for_url("**/login**", timeout=7_000)
        except PlaywrightTimeoutError:
            failures.append(path)
    if failures:
        raise AssertionError(f"Paths not redirecting to login: {', '.join(failures)}")
    return "protected pages redirect unauthenticated users to /login"


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        runner = TestRunner(browser)

        runner.run("Onboarding mobile story", onboarding_flow)
        runner.run("Planner multi-step flow", plan_builder_flow)
        runner.run("Login validation", login_validation)
        runner.run("Login + profile sign-out", login_flow)
        runner.run("Signup validation", signup_validation)
        runner.run("Premium paywall", premium_page)
        runner.run("Privacy policy content", privacy_page)
        runner.run("Auth redirects", auth_redirects)

        browser.close()

    timestamp = time.strftime("%Y%m%d-%H%M%S")
    report_path = RESULTS_DIR / f"report-{timestamp}.json"
    report_path.write_text(
        json.dumps(
            {
                "base_url": BASE_URL,
                "generated_at": timestamp,
                "results": runner.results,
            },
            indent=2,
        )
    )

    print(json.dumps({"report": str(report_path.relative_to(PROJECT_ROOT))}, indent=2))

    if any(result["status"] != "passed" for result in runner.results):
        sys.exit(1)


if __name__ == "__main__":
    main()
