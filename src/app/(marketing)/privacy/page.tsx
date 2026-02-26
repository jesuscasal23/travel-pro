// ============================================================
// Travel Pro — Privacy Policy Page
// ============================================================
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Travel Pro collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-24">
        <h1 className="text-foreground mb-2 text-3xl font-bold">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10 text-sm">Last updated: February 2026</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-foreground mb-3 text-xl font-semibold">1. Who we are</h2>
            <p className="text-muted-foreground leading-relaxed">
              Travel Pro is an AI-powered trip planning service. We help travellers plan
              multi-country itineraries using artificial intelligence. This policy explains how we
              handle your data in plain language.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-xl font-semibold">2. What data we collect</h2>
            <div className="space-y-3">
              {[
                {
                  title: "Account data",
                  desc: "Email address and password (hashed) when you create an account.",
                },
                {
                  title: "Profile data",
                  desc: "Nationality, home airport, travel style, interests, activity level, and languages spoken. Provided voluntarily during onboarding to personalise your itineraries.",
                },
                {
                  title: "Trip & itinerary data",
                  desc: "Trip planning intent (region, dates, travel style) and AI-generated itineraries. Stored so you can access, edit, and share your trips.",
                },
                {
                  title: "Analytics events",
                  desc: "Usage events (pages visited, features used, generation times) to improve the product. Collected only with your consent via the cookie banner.",
                },
                {
                  title: "Affiliate click data",
                  desc: "When you click a booking link (Skyscanner, Booking.com, GetYourGuide), we log the click type, destination, and a hashed IP address. This is how we earn revenue to keep the service free.",
                },
              ].map((item) => (
                <div key={item.title} className="card-travel p-4">
                  <h3 className="text-foreground mb-1 font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-foreground mb-3 text-xl font-semibold">3. Why we collect it</h2>
            <ul className="text-muted-foreground space-y-2">
              {[
                [
                  "To provide the service",
                  "Profile and trip data are required to generate personalised itineraries.",
                ],
                [
                  "To improve quality",
                  "Analytics events help us understand what works and what doesn't.",
                ],
                ["To earn revenue", "Affiliate click tracking funds the free tier of the service."],
                [
                  "To communicate with you",
                  "Transactional emails (itinerary ready, password reset) only.",
                ],
              ].map(([title, desc]) => (
                <li key={title} className="flex gap-2">
                  <span className="text-primary mt-0.5">→</span>
                  <span>
                    <strong className="text-foreground">{title}:</strong> {desc}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-xl font-semibold">4. Data retention</h2>
            <div className="overflow-x-auto">
              <table className="border-border w-full overflow-hidden rounded-lg border text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-foreground px-4 py-3 text-left font-semibold">Data type</th>
                    <th className="text-foreground px-4 py-3 text-left font-semibold">Retention</th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {[
                    ["Account & profile data", "Until you delete your account"],
                    ["Trip & itinerary data", "Until you delete your account or the trip"],
                    ["Analytics events", "12 months"],
                    ["Affiliate click logs", "24 months"],
                  ].map(([type, retention]) => (
                    <tr key={type}>
                      <td className="text-muted-foreground px-4 py-3">{type}</td>
                      <td className="text-muted-foreground px-4 py-3">{retention}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-foreground mb-3 text-xl font-semibold">
              5. Third-party processors
            </h2>
            <div className="text-muted-foreground space-y-2 text-sm">
              {[
                ["Supabase", "Database and authentication (EU region)"],
                ["Vercel", "Hosting and edge functions"],
                [
                  "Anthropic",
                  "AI itinerary generation (trip data is sent to Claude API; not used for model training)",
                ],
                ["PostHog", "Analytics (EU region, consent-gated)"],
                ["Resend", "Transactional email delivery"],
                ["MapLibre / Mapbox", "Map tile rendering"],
              ].map(([name, desc]) => (
                <p key={name}>
                  <strong className="text-foreground">{name}</strong> — {desc}
                </p>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-foreground mb-3 text-xl font-semibold">6. Your rights (GDPR)</h2>
            <ul className="text-muted-foreground space-y-2 text-sm">
              {[
                ["Access", "Download everything from your profile settings"],
                ["Correct", "Edit your profile at any time"],
                [
                  "Delete",
                  'Use the "Delete account" button in profile settings (cascade-deletes all trips)',
                ],
                [
                  "Object",
                  "Withdraw analytics consent via the cookie preferences link in the footer",
                ],
                ["Port", "Download a JSON export from profile settings"],
              ].map(([right, desc]) => (
                <li key={right}>
                  <strong className="text-foreground">{right}:</strong> {desc}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-foreground mb-3 text-xl font-semibold">7. Contact</h2>
            <p className="text-muted-foreground">
              For privacy questions, email{" "}
              <a href="mailto:privacy@travelpro.app" className="text-primary hover:underline">
                privacy@travelpro.app
              </a>
              . We respond within 72 hours.
            </p>
          </section>
        </div>

        <div className="border-border mt-12 border-t pt-8">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            ← Back to Travel Pro
          </Link>
        </div>
      </div>
    </div>
  );
}
