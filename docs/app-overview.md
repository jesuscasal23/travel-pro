# Fichi — Application Overview

> Last verified against codebase: 2026-03-21

**For use with Perplexity AI or external briefing.**

Fichi is a mobile-friendly, AI-powered trip planner for multi-destination journeys. It generates complete day-by-day itineraries with activities, visa requirements, and flight links in under a minute. Guests can plan without creating an account; authentication persists trips to a dashboard and enables GDPR data controls.

---

## Pages & Purpose

| Page               | Route                | Auth Required | Description                                                                   |
| ------------------ | -------------------- | ------------- | ----------------------------------------------------------------------------- |
| Landing            | `/`                  | No            | Marketing homepage with features overview and "Start Planning" CTA            |
| Privacy Policy     | `/privacy`           | No            | GDPR privacy policy                                                           |
| Sign Up            | `/signup`            | No            | Create account (email + password)                                             |
| Log In             | `/login`             | No            | Sign in, with "Forgot password" link                                          |
| Forgot Password    | `/forgot-password`   | No            | Request password reset email                                                  |
| Reset Password     | `/reset-password`    | No            | Complete password reset via email token                                       |
| Onboarding         | `/onboarding`        | Yes           | 2-step profile setup (nationality, airport, style, interests)                 |
| Plan               | `/plan`              | No            | Multi-step questionnaire + AI itinerary generation (guests welcome)           |
| Trip View          | `/trip/[id]`         | No            | Day-by-day itinerary: map + timeline split layout                             |
| Trip Edit          | `/trip/[id]/edit`    | No            | Drag-drop city editor (add, remove, reorder cities; adjust days)              |
| Trip Summary       | `/trip/[id]/summary` | No            | Full summary with visa checklist, weather, affiliate links, PDF export, share |
| Shared View        | `/share/[token]`     | No            | Read-only public view with OpenGraph metadata + growth CTA                    |
| Dashboard          | `/dashboard`         | Yes           | User's trip list with status badges                                           |
| Profile / Settings | `/profile`           | Yes           | Edit profile, download data (GDPR), delete account (GDPR)                     |

---

## User Flows

### Flow 1 — Guest Plans a Trip (No Account)

1. **Landing** → User clicks "Start Planning" → `/plan`

2. **Planning Questionnaire (4 steps)**
   - **Step 1 — Where are you from?**
     - Select nationality (199+ countries)
     - Select home airport (autocomplete search)
     - Both are required

   - **Step 2 — Travel Style & Interests**
     - Travel style: Backpacker / Comfort / Luxury (default: Comfort)
     - Interests (optional multi-select): Culture & History, Food & Cuisine, Nature & Hiking, Adventure Sports, Nightlife, Shopping, Photography, Wellness & Spa, Art & Design, Beach & Ocean

   - **Step 3 — Destination & Dates**
     - Trip type: One City / One Country / Multi-Country
       - Single City: City search (autocomplete)
       - Single Country: Country search (autocomplete)
       - Multi-Country: Choose a region (Southeast Asia, East Asia, South Asia, Europe, South America, Central America, Africa)
     - Date range: Start + end date (minimum 1 day)
     - Number of travelers: 1–10 (default: 2)

   - **Step 4 — Route Review** (Multi-city & Single-Country only)
     - AI proposes a list of cities with day allocations
     - User can reorder, adjust days, add or remove cities
     - Confirming triggers generation

3. **Generation** — AI generates itinerary via SSE stream. Stages in sequence:
   - Route selection (multi-city only)
   - Activities per city (Claude Haiku)
   - Visa enrichment (Passport Index, 199 passports × 227 destinations)
   - Weather enrichment (Open-Meteo historical averages, Redis cached)

4. **Trip View (`/trip/[id]`)**
   - Desktop: Map (left, 40%) + day-by-day timeline (right, 60%)
   - Mobile: Hero image, city row, swipeable day pills, activity list
   - Shows activities, visa cards, weather cards
   - Per-city regeneration button if a city has no activities
   - Links to Edit and Summary

5. **Summary (`/trip/[id]/summary`)**
   - Route overview and day-by-day compact table
   - Visa requirements with disclaimer + source links
   - Weather cards
   - Flight links (Skyscanner, with Amadeus optimization if available)
   - Hotel and activity affiliate links (Booking.com, GetYourGuide)
   - PDF export button
   - Share button → generates a `/share/[token]` URL, copies to clipboard

6. **Optional: Edit (`/trip/[id]/edit`)**
   - Drag-drop to reorder cities
   - Adjust days per city (minimum 1 day)
   - Add cities via search
   - Remove cities
   - Structural changes (add/remove/reorder) trigger itinerary regeneration on next trip view load

7. **Optional: Share**
   - Share link is read-only for recipients
   - Recipient sees a growth CTA: "Plan your own trip" → `/signup`

---

### Flow 2 — User Signs Up → Onboarding → Plans a Trip

1. **Sign Up (`/signup`)** — Email + password (8+ chars, 1 uppercase, 1 number, confirm)
2. **Email confirmation** → `/auth/callback` → `/onboarding`
3. **Onboarding (2 steps)**
   - Step 1: Nationality + home airport
   - Step 2: Travel style + interests
   - "Start Planning" → `/plan`
4. **Plan** — If profile already completed, only Steps 3–4 are shown (destination + dates)
5. **Trip saved to DB** with `profileId` → appears in Dashboard

---

### Flow 3 — Authenticated User Returns

1. **Log In (`/login`)** → `/dashboard`
2. **Dashboard** — Grid of past trips with status (Planning / Ready / Completed)
3. **Click trip card** → `/trip/[id]`
4. Navigation identical to guest flow from that point onward

---

### Flow 4 — User Updates Profile

1. Navbar avatar → `/profile`
2. Edit nationality, home airport, travel style, interests
3. "Save Changes" → PATCH `/api/v1/profile`

---

### Flow 5 — User Receives a Shared Link

1. Trip creator clicks "Share Link" on the Summary page
2. Share token created in DB → URL copied to clipboard
3. Recipient opens `/share/[token]`
   - Read-only itinerary view
   - Growth CTA banner at top: "Like this itinerary? Plan your own."
   - Cannot edit

---

### Flow 6 — GDPR Actions

- **Download data** (`/profile` → "Download my data") — Returns all user data as a JSON file
- **Delete account** (`/profile` → "Delete account") — Confirmation dialog → permanently deletes account, all trips, all itineraries

---

## What the App Can Do

| Feature                              | Notes                                                              |
| ------------------------------------ | ------------------------------------------------------------------ |
| AI itinerary generation              | Claude Haiku, day-by-day activities per city                       |
| Multi-city route optimization        | AI suggests cities + day allocations                               |
| Single-city and single-country trips | Supported in planning flow                                         |
| Drag-drop city editor                | Add, remove, reorder; structural changes trigger regeneration      |
| Per-city activity regeneration       | Generates activities for a single city without full regen          |
| Visa requirements lookup             | Passport Index static dataset, informational only                  |
| Weather data                         | Open-Meteo historical averages, 7-day Redis cache                  |
| Flight price optimization            | Amadeus API (optional), multi-date search for cheapest option      |
| Affiliate links                      | Skyscanner, Booking.com, GetYourGuide with click tracking          |
| PDF export                           | Downloadable branded PDF of the full itinerary                     |
| Shareable read-only URLs             | Public links with OpenGraph metadata for social sharing            |
| GDPR data export                     | Full JSON download of all user data                                |
| GDPR account deletion                | Permanent deletion of account + all associated data                |
| Dark mode                            | User-toggled, persisted                                            |
| Guest access                         | Plan, view, and edit without an account                            |
| Rate limiting                        | Redis-based sliding window on generation and shared-trip endpoints |

---

## What the App Cannot Do (Limitations)

### Booking & Commerce

- **No real-time booking** — The app generates itineraries and links to external booking sites (Skyscanner, Booking.com, GetYourGuide) but does not complete any reservations directly
- **No price guarantees** — Flight and accommodation prices are estimates or affiliate links; actual prices are on partner sites
- **No insurance** — No travel insurance integration or recommendations

### Collaboration & Social

- **No multi-user editing** — A trip belongs to one user; there is no co-editing or invite system
- **No comments or notes** — Users cannot annotate activities or days
- **No trip approval or voting** — Cannot share a draft for group feedback before finalizing

### Visa & Legal

- **Visa info is informational only** — The app shows visa requirements from a static dataset but does not facilitate applications or guarantee accuracy
- **Visa data may be outdated** — The Passport Index dataset is static; real-time policy changes are not reflected

### Weather

- **Historical averages, not forecasts** — Weather data is based on Open-Meteo historical patterns, not actual forecasts. It is not reliable for trips within the next 7–14 days in the traditional forecast sense

### Language & Accessibility

- **English only** — No multi-language support
- **No accessibility audit** — Not verified against WCAG standards

### Platform

- **Web only** — No native iOS or Android app
- **No offline mode** — Authenticated users require internet to load their trips (Zustand persists the last loaded itinerary locally, but updates require connectivity)

### Trip Management

- **No version history UI** — Multiple itinerary versions are stored in the database but there is no UI to browse or restore past versions
- **No undo/redo** — Edit changes are committed immediately
- **No recurring trips or templates** — Cannot copy or templatize a previous trip
- **No calendar export** — Cannot export trip days to Google Calendar, Apple Calendar, etc.
- **No packing list or checklists** — No document checklist or to-do items attached to a trip
- **No in-trip expense tracking** — No budget log or expense splitting among travelers
- **No activity-level cost breakdown** — Budget is a high-level estimate per category (flights, accommodation, food, activities, transport); no per-activity pricing

### Map

- **Read-only map** — The route map is for visualization only; users cannot draw, annotate, or interact with the route

---

## Guest vs. Authenticated Comparison

| Feature                  | Guest                        | Authenticated                      |
| ------------------------ | ---------------------------- | ---------------------------------- |
| Plan a trip              | Yes                          | Yes                                |
| View a trip              | Yes                          | Yes                                |
| Edit a trip              | Yes                          | Yes                                |
| Share a trip             | Yes (generates URL)          | Yes (generates URL + stored in DB) |
| Dashboard (past trips)   | No                           | Yes                                |
| Save profile preferences | Local (Zustand/localStorage) | Yes (database)                     |
| Download data (GDPR)     | No                           | Yes                                |
| Delete account (GDPR)    | No                           | Yes                                |

---

## Technical Constraints (Relevant to Users)

| Constraint             | Value             | Impact                                                   |
| ---------------------- | ----------------- | -------------------------------------------------------- |
| Generation timeout     | 50 seconds        | Long trips may occasionally time out                     |
| Generation rate limit  | 5 per hour per IP | Prevents generating many itineraries in quick succession |
| Shared link rate limit | 60 requests/min   | Shared links throttle under heavy traffic                |
| Max travelers input    | 10                | Party size capped at 10 in the UI                        |
| Minimum trip length    | 1 day             | Date range must be at least 1 day                        |

---

## Example Itinerary — Sample Data

The app ships with a sample trip for demonstration:

- **Travelers**: Thomas & Lena (2 people, comfort style)
- **Route**: Tokyo (5d) → Kyoto (3d) → Hanoi (3d) → Ha Long Bay (2d) → Bangkok (4d) → Chiang Mai (3d) → Phuket (2d)
- **Duration**: 22 days
- **Budget**: €10,000
- **Interests**: Culture & History, Food & Cuisine, Nature & Hiking, Art & Design, Beach & Ocean
- **Visa info**: Japan (visa-free), Vietnam (e-visa), Thailand (visa-free)
- **Activities**: 70+ activities across 7 cities with estimated costs, tips, and food recommendations

This sample appears in the dashboard empty state and can be explored without generating a new trip.

---

## Data Collected

| Category         | Data Points                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Account          | Email address, hashed password (Supabase)                                                               |
| Profile          | Nationality, home airport, travel style, interests, activity level, languages spoken                    |
| Trips            | Trip type, region/destination, dates, traveler count, status                                            |
| Itineraries      | Full day-by-day plan, activities, visa data, weather data, flight legs                                  |
| Analytics        | Page views, planning completion, generation events, shares, exports (PostHog, EU region, consent-gated) |
| Affiliate clicks | Provider, city, destination, anonymized IP hash                                                         |

---

_Generated from codebase on 2026-02-22._
