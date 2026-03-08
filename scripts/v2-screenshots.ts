import { chromium } from "playwright";
import path from "path";

const PAGES = [
  { name: "01-landing", url: "/v2" },
  { name: "02-features", url: "/v2/onboarding/features" },
  { name: "03-travel-dna", url: "/v2/onboarding/travel-dna" },
  { name: "04-preferences", url: "/v2/onboarding/preferences" },
  { name: "05-interests", url: "/v2/onboarding/interests" },
  { name: "06-budget", url: "/v2/onboarding/budget" },
  { name: "07-pace", url: "/v2/onboarding/pace" },
  { name: "08-pain-points", url: "/v2/onboarding/pain-points" },
  { name: "09-summary", url: "/v2/onboarding/summary" },
  { name: "10-signup", url: "/v2/onboarding/signup" },
  { name: "11-home", url: "/v2/home" },
  { name: "12-trips", url: "/v2/trips" },
  { name: "13-discover", url: "/v2/discover" },
  { name: "14-bookings", url: "/v2/bookings" },
  { name: "15-profile", url: "/v2/profile" },
];

const OUT_DIR = path.join(process.cwd(), "tmp/v2-screenshots");

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 }, // iPhone 14 Pro
  });

  // Dismiss cookie consent banner so it doesn't overlap CTA buttons
  await context.addCookies([
    {
      name: "travel_pro_consent",
      value: "accepted",
      domain: "localhost",
      path: "/",
    },
  ]);

  for (const page of PAGES) {
    const tab = await context.newPage();
    await tab.goto(`http://localhost:3000${page.url}`, {
      waitUntil: "networkidle",
    });
    // Wait a bit for any CSS transitions
    await tab.waitForTimeout(500);
    await tab.screenshot({
      path: path.join(OUT_DIR, `${page.name}.png`),
      fullPage: true,
    });
    console.log(`✓ ${page.name}`);
    await tab.close();
  }

  await browser.close();
  console.log(`\nScreenshots saved to ${OUT_DIR}`);
}

main().catch(console.error);
