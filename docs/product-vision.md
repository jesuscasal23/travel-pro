# Fichi — Product Vision

> Last updated: 2026-03-31

## Mission

Fichi is a **personal travel assistant** that helps you plan and execute trips end-to-end — from inspiration to booking to day-of guidance. It learns your preferences, personality, and travel style over time, giving you increasingly relevant suggestions so every trip feels like it was planned by someone who truly knows you.

**One-liner:** _A personal travel assistant that learns how you travel and helps you enjoy every trip more._

---

## Vision (2-year horizon → early 2028)

Build a **small, loyal community of repeat travelers** who trust Fichi as their go-to travel companion. Success is measured by retention and repeat usage, not scale. A user who plans 3+ trips through Fichi and tells a friend is worth more than 1,000 signups who never return.

**North star metric:** % of users who plan a second trip within 6 months of their first.

---

## Target User

### Primary: The Overwhelmed Multi-City Planner

- **Who:** 25–45, digitally native, travels 2–4 times/year, speaks English
- **Pain:** Spends 10–20 hours researching across tabs, spreadsheets, and Reddit threads for a 2-week trip. Gets decision fatigue. Ends up with a half-baked plan or over-plans and misses spontaneous joy.
- **Motivation:** Wants a trip that feels personal — not a cookie-cutter itinerary, not a travel agent's upsell. Values efficiency but won't sacrifice quality for speed.
- **Tech comfort:** Uses Notion/Google Docs for planning today. Comfortable with AI tools. Mobile-first but plans on desktop too.

### Future (post-PMF): Digital Nomads

- Plan in shorter bursts (1–2 week stays), care about wifi/coworking/cost-of-living
- High frequency users — could become power users and evangelists
- Not a priority until core experience is validated

---

## Competitive Positioning

### Why Fichi wins

The #1 reason someone picks Fichi: **it does the thinking for you, but it still feels like your trip.**

Most travel tools fall into two camps:

1. **Aggregators** (Google Trips, TripAdvisor, Skyscanner) — great for searching, terrible for planning. You still stitch everything together yourself.
2. **Planners** (Wanderlog, TripIt, Sygic) — help you organize what you already decided, but don't help you decide.

Fichi occupies a third space: **an opinionated assistant that generates a complete, personalized plan you can refine.** The swipe-based activity discovery makes curation feel effortless. The vibe system and learning loop make recommendations get better over time.

| Dimension                   | Aggregators | Planners | Fichi                         |
| --------------------------- | ----------- | -------- | ----------------------------- |
| Helps you decide what to do | No          | No       | Yes (AI + swipe)              |
| Builds full itinerary       | No          | Manual   | Auto-generated                |
| Personalizes to your style  | No          | No       | Yes (Travel DNA)              |
| Handles flights + hotels    | Search only | No       | Search + booking flow         |
| Multi-city route planning   | No          | Basic    | Optimized                     |
| Learns over time            | No          | No       | Yes (swipe history + profile) |

### What Fichi is NOT

- **Not a booking engine.** Fichi helps you decide and directs you to book — it doesn't process payments for flights/hotels. Affiliate partnerships keep the model asset-light.
- **Not a social network.** No feeds, no followers, no "top 10 lists by influencers." Fichi is a private, personal tool.
- **Not a travel encyclopedia.** Fichi doesn't try to catalog every restaurant in Tokyo. It curates a small, relevant set based on who you are.
- **Not a group coordination tool** (yet). Focus is on individual or couple travelers. Group trips are a future expansion, not a priority.

---

## Core Value Loop

```
Profile (Travel DNA)
    ↓
Plan a trip → AI generates personalized itinerary
    ↓
Discover activities → Swipe to refine → Itinerary improves
    ↓
Enrich → Flights, hotels, visa, weather, budget
    ↓
Book → Affiliate links to partners
    ↓
Travel → (future: day-of guidance, live updates)
    ↓
Return → Preferences updated, next trip is smarter
```

The loop gets stronger with each trip. Swipe history, booking patterns, and explicit profile data compound into a richer understanding of the traveler.

---

## Current Product State (v0.5, March 2026)

### What works well

- **Trip planning flow:** Destination selection → skeleton generation → activity discovery is smooth and fast
- **Activity discovery:** Swipe-based AI curation is the core differentiator and feels good
- **Enrichment pipeline:** Visa, weather, flights, hotels all populate automatically
- **Onboarding:** Travel DNA (vibes, interests, pace, budget) captures meaningful preferences
- **PDF export:** Professional, shareable itinerary document

### What's incomplete or broken

| Area                     | State                                                                                                                                       | Priority                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Booking flow**         | Users find flights/hotels but booking links open external sites with no confirmation feedback. Booking data doesn't flow back into the app. | **P0** — critical for monetization and UX completeness |
| **Bookings/Wallet page** | Full UI exists but uses mock data. No backend integration.                                                                                  | **P0** — paired with booking flow                      |
| **Share trip**           | Button exists but is disabled ("Soon" badge). No share token API.                                                                           | **P1** — key growth lever                              |
| **Per-trip unlock**      | Pricing card shows but clicking it says "Coming soon."                                                                                      | **P1** — monetization experiment                       |
| **Budget estimation**    | Shows "Not estimated" for categories without data. Incomplete across activities.                                                            | **P2** — nice-to-have accuracy                         |
| **Visa requirements**    | Marked beta, always shows incomplete. Excluded from prep calculations.                                                                      | **P2** — data quality issue                            |

### Technical debt

- Superuser paywall test button left in production home page
- Manual booking fallback (hardcoded Booking.com URL) in accommodation tab
- Architecture map page in `_dev/` (harmless, dev-only)

---

## Monetization Strategy

### Primary: Subscriptions

- **Lifetime:** $499 (one-time) — targets power users and early adopters
- **Yearly:** $99/yr ($8.25/mo) — main conversion target
- **Monthly:** $12.99/mo — low commitment entry
- **Per-trip:** $19.99 (not yet implemented) — experiment for casual users

Stripe integration is live for lifetime/yearly/monthly. Next milestone: **validate willingness to pay** before optimizing pricing.

### Secondary: Affiliate Revenue

- **Skyscanner** (flights), **Booking.com** (hotels), **GetYourGuide** (activities)
- Click tracking is implemented with metadata (provider, city, price)
- Revenue scales with trip volume — every completed trip generates multiple booking opportunities

### Monetization principles

1. Free tier must be genuinely useful (full planning, activity discovery, PDF export)
2. Premium unlocks convenience and depth (unlimited searches, alerts, booking management)
3. Never paywall the core planning experience — that's how you earn trust
4. Affiliate revenue should feel helpful (good deals), not intrusive (no banner ads)

---

## Strategic Priorities (next 3 months)

### P0 — Make booking feel complete

The biggest gap is that Fichi plans a great trip but then "hands you off" to external sites. Users need to feel that Fichi is their trip companion through booking, not just planning.

- Wire up booking confirmation flow (user marks flights/hotels as booked, data stored)
- Replace mock bookings page with real data from affiliate clicks + confirmations
- Show booking status in trip preparation tracker
- Post-booking enrichment (confirmation details, check-in reminders)

### P1 — Enable organic growth

- Implement trip sharing (public link with read-only itinerary view)
- Add growth CTA on shared pages ("Plan your own trip with Fichi")
- Share via WhatsApp/email with preview card (OpenGraph)

### P1 — Validate monetization

- Ship per-trip unlock to test price sensitivity
- Track conversion funnel: free plan → premium gate → checkout → payment
- Instrument affiliate click-through rates and estimated commission

### P2 — Deepen personalization

- Use swipe history across trips to improve activity recommendations
- Surface "because you liked X" reasoning in activity cards
- Let users rate completed trips to close the feedback loop

### P3 — Quality & polish

- Fix budget estimation gaps
- Graduate visa feature from beta
- Clean up technical debt (paywall test button, manual booking fallback)

---

## Principles

1. **Personal over popular.** Recommend what fits this person, not what's trending.
2. **Complete over feature-rich.** A small set of features that work end-to-end beats a large set of half-finished ones.
3. **Earn trust through transparency.** Show why we recommend something. Never hide affiliate motivations.
4. **Learn quietly.** Improve recommendations from behavior (swipes, bookings, ratings) without making users fill out surveys.
5. **Mobile-first, desktop-capable.** The app is designed for phones but should work well on any screen.
6. **Small and loyal > big and churny.** Optimize for users who come back, not for signup volume.

---

## Success Metrics

| Metric                            | Target                                            | Why it matters            |
| --------------------------------- | ------------------------------------------------- | ------------------------- |
| **Repeat trip rate**              | >30% plan a 2nd trip within 6 months              | Core retention signal     |
| **Activity discovery completion** | >70% complete at least 1 round per city           | Core feature engagement   |
| **Booking click-through**         | >40% of trips generate at least 1 affiliate click | Monetization health       |
| **Share rate**                    | >15% of completed trips are shared                | Organic growth potential  |
| **Premium conversion**            | >5% of active users on a paid plan                | Revenue sustainability    |
| **NPS**                           | >50                                               | Product-market fit signal |

---

## Open Questions

These are unresolved and should be revisited as data comes in:

1. **Per-trip vs. subscription:** Which converts better for first-time payers? Ship both, measure.
2. **Digital nomad expansion:** When (if ever) to add coworking/wifi/cost-of-living data?
3. **Group trips:** Is there demand, or do couples/solo travelers dominate?
4. **Day-of guidance:** Should Fichi send push notifications during the trip? ("Your dinner reservation is in 2 hours")
5. **Offline mode:** How important is offline access for travelers in spotty-wifi destinations?
6. **Multi-language:** When does English-only become a growth ceiling?
