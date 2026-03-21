import { chromium } from "playwright";
import path from "path";

const PAGES = [
  { name: "01-get-started", url: "/get-started" },
  { name: "02-features", url: "/onboarding/features" },
  { name: "03-travel-dna", url: "/onboarding/travel-dna" },
  { name: "04-about-you", url: "/onboarding/about-you" },
  { name: "05-travel-style", url: "/onboarding/preferences" },
  { name: "06-interests", url: "/onboarding/interests" },
  { name: "07-pace", url: "/onboarding/pace" },
  { name: "08-pain-points", url: "/onboarding/pain-points" },
  { name: "09-summary", url: "/onboarding/summary" },
  { name: "10-signup", url: "/onboarding/signup" },
  { name: "11-home", url: "/home" },
  { name: "12-trips", url: "/trips" },
  { name: "13-discover", url: "/discover" },
  { name: "14-bookings", url: "/bookings" },
  { name: "15-profile", url: "/profile" },
];

const OUT_DIR = path.join(process.cwd(), "tmp/mobile-screenshots");

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
