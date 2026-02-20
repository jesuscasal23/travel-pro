# Travel Pro — Frontend Architecture Report

**Prepared for:** Lead Frontend Developer
**Date:** February 19, 2026
**Scope:** Complete UI analysis, feature inventory, and architectural recommendations

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Application Structure & Routing](#2-application-structure--routing)
3. [Design System](#3-design-system)
4. [Component Library](#4-component-library)
5. [State Management](#5-state-management)
6. [Page-by-Page Feature Breakdown](#6-page-by-page-feature-breakdown)
7. [User Journeys](#7-user-journeys)
8. [Animation System](#8-animation-system)
9. [Data Layer & API Integration](#9-data-layer--api-integration)
10. [Top 10 Frontend Architecture Improvements](#10-top-10-frontend-architecture-improvements)

---

## 1. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16 |
| UI Library | React | 19 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS (CSS variables via `@theme inline`) | v4 |
| State | Zustand with `persist` middleware → localStorage | 5 |
| Animation | Framer Motion | latest |
| Maps | MapLibre GL via `react-map-gl/maplibre` | v8 |
| Icons | Lucide React | latest |
| Dialogs | Radix UI (Dialog primitive) | latest |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable | latest |
| PDF Export | @react-pdf/renderer (dynamic import) | latest |
| Analytics | PostHog (EU region, consent-gated) | latest |
| Error Tracking | Sentry | latest |
| Data Fetching | React Query (TanStack Query) | latest |
| Auth | Supabase Auth (email/password + SSR middleware) | latest |

---

## 2. Application Structure & Routing

### Route Groups

The app uses Next.js App Router with **route groups** for layout segmentation:

```
src/app/
├── layout.tsx                    # Root layout (Providers, fonts, dark mode script)
├── (marketing)/                  # Public pages with Navbar
│   ├── layout.tsx                # Wraps children with Navbar(isAuthenticated=false)
│   ├── page.tsx                  # Landing page (/)
│   └── privacy/page.tsx          # Privacy policy (/privacy)
├── (auth)/                       # Auth pages (centered card layout)
│   ├── layout.tsx                # Minimal layout, no navbar
│   ├── signup/page.tsx           # /signup
│   ├── login/page.tsx            # /login
│   ├── forgot-password/page.tsx  # /forgot-password
│   └── reset-password/page.tsx   # /reset-password
├── (app)/                        # Authenticated app pages
│   └── profile/page.tsx          # /profile (protected)
├── auth/callback/route.ts        # Supabase OAuth callback
├── onboarding/page.tsx           # /onboarding (post-signup)
├── dashboard/page.tsx            # /dashboard (protected)
├── plan/page.tsx                 # /plan (public, guest-friendly)
├── trip/[id]/                    # Trip detail routes
│   ├── page.tsx                  # /trip/:id (public)
│   ├── edit/page.tsx             # /trip/:id/edit
│   └── summary/page.tsx          # /trip/:id/summary
└── share/[token]/page.tsx        # /share/:token (public, read-only)
```

### Auth Boundaries

| Route | Auth Required | Notes |
|-------|:---:|-------|
| `/`, `/privacy` | No | Marketing pages |
| `/signup`, `/login`, `/forgot-password`, `/reset-password` | No | Auth forms |
| `/onboarding` | No | Profile setup (optional) |
| `/plan` | No | Guest-friendly questionnaire |
| `/trip/[id]` | No | Guest can view generated trips |
| `/trip/[id]/edit` | No | Guest can edit in-memory |
| `/trip/[id]/summary` | No | Guest can view summary |
| `/share/[token]` | No | Public share link |
| `/dashboard` | **Yes** | Redirects to `/login?next=/dashboard` |
| `/profile` | **Yes** | Redirects to `/login?next=/profile` |

---

## 3. Design System

### Color Tokens

All colors defined as CSS variables in `src/app/globals.css` using Tailwind v4's `@theme inline`:

| Token | Light Mode | Dark Mode | Tailwind Class |
|-------|-----------|-----------|----------------|
| `--primary` | `#0D7377` (teal) | Same | `bg-primary`, `text-primary` |
| `--accent` | `#E85D4A` (coral) | Same | `bg-accent`, `text-accent` |
| `--background` | `#FFFFFF` | `#0A0A0A` | `bg-background` |
| `--foreground` | `#1A1A1A` | `#EDEDED` | `text-foreground` |
| `--card` | `#FFFFFF` | `#141414` | `bg-card` |
| `--muted` | `#F5F5F5` | `#262626` | `bg-muted` |
| `--muted-foreground` | `#666666` | `#999999` | `text-muted-foreground` |
| `--secondary` | `#F5F5F5` | `#262626` | `bg-secondary` |
| `--border` | `#E6E6E6` | `#333333` | `border-border` |
| `--ring` | `#0D7377` | Same | `ring-ring` |

### Shadow Tokens

| Token | Light | Dark |
|-------|-------|------|
| `--shadow-card` | `0 2px 8px rgba(0,0,0,0.08)` | `0 2px 8px rgba(0,0,0,0.3)` |
| `--shadow-card-hover` | `0 4px 16px rgba(0,0,0,0.12)` | `0 4px 16px rgba(0,0,0,0.4)` |
| `--shadow-hero` | `0 8px 32px rgba(13,115,119,0.25)` | `0 8px 32px rgba(13,115,119,0.4)` |

### Component CSS Classes

Defined in `globals.css` via `@layer components`:

| Class | Description |
|-------|-------------|
| `.card-travel` | Rounded-xl, p-6, card background with shadow |
| `.btn-primary` | Teal background, white text, rounded-lg, px-6 py-3 |
| `.btn-ghost` | Transparent background, border, hover muted background |
| `.chip` | Rounded-full pill, px-4 py-2, border, text-sm |
| `.chip-selected` | Primary background, white text, primary border |
| `.badge-success` | Emerald-100 background, emerald-700 text |
| `.badge-warning` | Amber-100 background, amber-700 text |
| `.badge-info` | Sky-100 background, sky-700 text |

### Dark Mode Implementation

- Toggle via `dark` class on `<html>` element
- **Flash prevention:** Inline `<script>` in root layout reads `localStorage.theme` before first paint
- `ThemeToggle` component: Sun/Moon icon button in Navbar
- All colors switch automatically via CSS variable overrides in `.dark` selector

### Typography

- **Font:** Inter (loaded via `next/font/google`)
- **Scale:** text-xs (12px) → text-sm (14px) → text-base (16px) → text-lg (18px) → text-xl (20px) → text-5xl (48px) → text-7xl (72px)
- **Weights:** font-medium (500), font-semibold (600), font-bold (700)

---

## 4. Component Library

### 4.1 Foundation Components (`src/components/ui/`)

#### Button (`Button.tsx`)
- **Variants:** `primary` | `ghost` | `danger` | `danger-outline`
- **Sizes:** `xs` | `sm` | `md` | `lg`
- **Features:** Loading spinner (Loader2 icon), icon-only mode (square), disabled state (opacity-60)
- **Implementation:** `forwardRef` for DOM ref access

#### Card (`Card.tsx`)
- Uses `.card-travel` CSS class
- Optional `hoverable` prop adds shadow transition on hover

#### Badge (`Badge.tsx`)
- **Variants:** `success` (green) | `warning` (amber) | `info` (blue)
- Thin pill-shaped status indicators

#### Chip & ChipGroup (`Chip.tsx`)
- **Chip:** Toggle button with `.chip` / `.chip-selected` CSS classes
- **ChipGroup:** Flex-wrap container rendering multiple Chips from `options[]`
- Used for: Interest selection, multi-select interactions

#### FormField (`FormField.tsx`)
- Label + children wrapper with optional error message and label suffix (e.g., "Forgot password?" link)

#### Modal (`Modal.tsx`)
- Built on **Radix Dialog** primitive
- Black/50 overlay, centered content panel, X close button
- Configurable `maxWidth` (default: max-w-md)

#### ConfirmDialog (`ConfirmDialog.tsx`)
- Extends Modal with: description, bulleted items list, bold warning text
- Two-button footer: Cancel (ghost) + Confirm (danger or primary)
- Used for: Account deletion, destructive actions

#### EmptyState (`EmptyState.tsx`)
- Dashed border container with centered icon, title, description, and optional action button
- Used for: No trips found, empty data states

#### SelectionCard (`SelectionCard.tsx`)
- Toggle card with border-2 highlight when selected
- Used for: Trip type selection, region picker, travel style

#### BackLink (`BackLink.tsx`)
- ArrowLeft icon + label, linking back to previous page

#### CollapsibleSection (`CollapsibleSection.tsx`)
- Animated expand/collapse (Framer Motion height 0→auto)
- ChevronDown rotates 180° when open
- Used in: Trip sidebar (Route, Visas, Weather sections)

#### Toast (`Toast.tsx`)
- Fixed bottom-right toast notifications
- Framer Motion entrance: opacity + y slide + scale
- Auto-dismiss after 3 seconds

#### ProgressBar & StepProgress (`ProgressBar.tsx`, `StepProgress.tsx`)
- Animated width bar (Framer Motion)
- StepProgress: "Step X of Y" label + percentage + bar

#### Skeleton, SkeletonCard, SkeletonText (`Skeleton.tsx`)
- `animate-pulse` loading placeholders in three form factors

#### LoadingSpinner (`LoadingSpinner.tsx`)
- Pulsing circle with configurable size

### 4.2 Specialized Input Components

#### AirportCombobox (`AirportCombobox.tsx`)
- Autocomplete over 6,000+ airports from static dataset
- Filters by: IATA code prefix, city, airport name, country
- Keyboard navigation: Arrow keys, Enter to select, Escape to close
- Shows IATA code in monospace + airport name + city/country
- Max 8 results displayed

#### CityCombobox (`CityCombobox.tsx`)
- Autocomplete for destination cities with `popular` flag
- Shows "Popular destinations" header when query is empty
- Returns full `CityEntry` with lat/lng coordinates
- Same keyboard navigation pattern as AirportCombobox

### 4.3 Navigation Components

#### Navbar (`Navbar.tsx`)
- Fixed top bar: `bg-background/95 backdrop-blur-sm`, h-16, z-50
- Left: Logo (links to `/dashboard` if auth'd, `/` if guest)
- Right: ThemeToggle + auth-dependent content:
  - **Authenticated:** Avatar circle (initials) + display name
  - **Guest:** "Sign In" link

#### ThemeToggle (`ThemeToggle.tsx`)
- Sun/Moon icon toggle
- Reads/writes `localStorage.theme`
- Toggles `.dark` class on `<html>`
- Returns `null` on first render (hydration safety)

#### CookieConsent (`CookieConsent.tsx`)
- Fixed bottom banner, shown if `travel_pro_consent` cookie not set
- "Reject" (ghost) and "Accept all" (primary) buttons
- Accepted → enables PostHog analytics capture

### 4.4 Trip Feature Components

#### BudgetBreakdown (`BudgetBreakdown.tsx`)
- Renders budget categories (flights, accommodation, food, activities, transport) with formatted euro values
- Optional progress bars showing each category as percentage of total budget

#### TravelStylePicker (`TravelStylePicker.tsx`)
- Three radio cards: Backpacker (🎒), Comfort (🛏️), Luxury (✨)
- Compact mode (profile page): horizontal flex, small cards
- Full mode (onboarding): vertical stack, larger cards with descriptions

#### WorldMapSVG (`WorldMapSVG.tsx`)
- Decorative SVG continent outlines at very low opacity (4-8% primary color)
- `aria-hidden="true"`, used as landing page background

#### TripNotFound (`TripNotFound.tsx`)
- Full-screen 404 for invalid trip IDs with "Back to dashboard" CTA

### 4.5 Plan View Components (`src/components/trip/plan-view/`)

#### PlanViewLayout (`PlanViewLayout.tsx`)
- 28/72 split layout on desktop (sidebar + main content)
- Three tabs: Itinerary | Essentials | Budget
- Tab bar with primary-color underline indicator on active tab
- Sidebar hidden on mobile, sticky on desktop

#### PlanSidebar (`PlanSidebar.tsx`)
- **Trip Overview Card:** Week count, route chain (home→cities→home), dates, budget badge
- **Route & Transport:** Collapsible section with transport legs (plane/train/bus icons)
- **Visas & Health:** Country code badges with color-coded requirement status
- **Weather:** Temperature ranges by country

#### ItineraryTab (`ItineraryTab.tsx`)
- Expandable day cards with animated collapse/expand
- Day header: number circle, city, date, type badge (Arrival/Full day/Travel)
- Expanded: activities list with name, category, duration, cost, tips, food recommendations
- Staggered Framer Motion entrance animation

#### BudgetTab (`BudgetTab.tsx`)
- **Hero total card** with large typography and over/under badge
- **Stacked bar chart** showing category percentages with color coding
- **Per-city breakdown table** (multi-city only) using `deriveCityBudgets()` utility
- **Adjustment buttons:** "Tighten by 10%" and "Upgrade stays" (±10%, +30% accommodation)

#### EssentialsTab (`EssentialsTab.tsx`)
- **Visa section:** Status badges per country with "Official site" links
- **Weather section:** 3-column grid with temperature and conditions per city
- **Smart Packing List:** Checkbox grid auto-generated from weather + visa + activity data
  - Categories: clothing, toiletries, electronics, documents, health, misc
  - Smart logic: power adapter types by country, layers if cold, swimwear if beach activities

### 4.6 Map Components

#### RouteMap (`RouteMap.tsx`)
- **MapLibre GL** via `react-map-gl/maplibre` (dynamically imported, SSR disabled)
- **Tile source:** CARTO Positron (free, no API key for tiles)
- **Features:**
  - Dashed route line (GeoJSON LineString, opacity 0.6, color #0D7377)
  - Numbered city markers (32px circles, 40px when active with box-shadow)
  - Click marker → popup with city name, country, days
  - Auto-fits bounds on load (80px padding, 1000ms fly)
  - Flies to active city at zoom 8 when `activeCityIndex` changes

#### RouteMapFallback (`RouteMapFallback.tsx`)
- Pure SVG fallback (no WebGL dependency)
- Auto-scales to fit city coordinates within viewBox
- Dashed polyline route + numbered circle markers + city labels

### 4.7 Export Components

#### PDFDownloadButton (`PDFDownloadButton.tsx`)
- **Dynamic import** of `@react-pdf/renderer` (client-only, prevents SSR crash)
- Three states: loading → ready → error
- Renders `PDFDownloadLink` with styled button wrapper

### 4.8 Auth Components

#### ServerErrorAlert (`ServerErrorAlert.tsx`)
- Light red/dark red background alert box for auth form errors
- Renders conditionally only when `error` prop is truthy

---

## 5. State Management

### Zustand Store (`src/stores/useTripStore.ts`)

Central client-side store with `persist` middleware saving to `localStorage` under key `"travel-pro-store"`.

#### Persisted Fields (survive page refresh)

| Category | Fields |
|----------|--------|
| **Profile** | `onboardingStep`, `nationality`, `homeAirport`, `travelStyle`, `interests[]`, `displayName` |
| **Trip Intent** | `tripType`, `region`, `destination`, `destinationCountry`, `destinationCountryCode`, `destinationLat`, `destinationLng`, `dateStart`, `dateEnd`, `flexibleDates`, `budget`, `travelers` |
| **Trip Result** | `currentTripId`, `itinerary` |

#### Transient Fields (reset on refresh)

| Field | Purpose |
|-------|---------|
| `planStep` | Current questionnaire step number |
| `isGenerating` | Whether AI generation is in progress |
| `generationStep` | Current pipeline step index (0-5) |

#### Actions

| Category | Actions |
|----------|---------|
| **Profile** | `setOnboardingStep()`, `setNationality()`, `setHomeAirport()`, `setTravelStyle()`, `toggleInterest()`, `setDisplayName()` |
| **Plan** | `setPlanStep()`, `setTripType()`, `setRegion()`, `setDestination()`, `clearDestination()`, `setDateStart()`, `setDateEnd()`, `setFlexibleDates()`, `setBudget()`, `setTravelers()` |
| **Generation** | `setIsGenerating()`, `setGenerationStep()` |
| **Results** | `setCurrentTripId()`, `setItinerary()` |
| **Reset** | `resetPlan()` — resets all plan fields to defaults |

#### Default Plan State

```typescript
{
  planStep: 1,
  tripType: "multi-city",
  region: "",
  destination: "",
  budget: 10000,        // €10,000 default
  travelers: 2,         // 2 travelers default
  flexibleDates: false,
  isGenerating: false,
  generationStep: 0,
}
```

### Custom Hooks

| Hook | Location | Purpose | Exported |
|------|----------|---------|:---:|
| `useToast()` | `src/hooks/useToast.ts` | Toast notifications with auto-dismiss (3s), returns `{ toasts, toast(), dismiss() }` | Yes |
| `useScrollSync()` | `src/hooks/useScrollSync.ts` | Coordinates map pin clicks with timeline scroll, returns `{ dayRefs, handleCityClick(), getCityIndexForDay() }` | Yes |
| `useAuthStatus()` | `src/hooks/useAuthStatus.ts` | Calls `supabase.auth.getUser()` on mount, returns `boolean \| null` | No |
| `useItinerary()` | `src/hooks/useItinerary.ts` | Selector for `useTripStore(s => s.itinerary)` | No |

### React Query Configuration

Configured in `src/components/Providers.tsx`:
- `staleTime: 60_000` (1 minute)
- `retry: 1`
- Currently used primarily for PostHog provider wrapping; most data fetching is done via direct `fetch()` calls

---

## 6. Page-by-Page Feature Breakdown

### 6.1 Landing Page (`/`)

**Component:** Client component in `(marketing)` layout with Navbar

**Sections:**
1. **Hero** — Animated WorldMapSVG background, headline "Plan your dream trip in minutes, not weeks", twin CTAs ("Start Planning" → `/plan`, "See how it works" → scroll anchor), social proof bar (avatars + "Trusted by 10,000+ travelers")
2. **Features** — 4-column responsive grid (AI Itinerary, Smart Route, Visa & Budget, Zero Throwaway Work) with Framer Motion fade-up on scroll
3. **Testimonials** — 3-column grid with avatar initials, location, and quote
4. **How It Works** — 3-step process (Profile → Plan → Itinerary) with icon circles
5. **Footer** — Copyright, About, Privacy, Contact links

**Responsive:** Hero text scales 5xl→6xl→7xl. Feature grid: 1→2→4 columns. Testimonials: 1→3 columns.

### 6.2 Privacy Page (`/privacy`)

**Component:** Server component

**Content:** GDPR-compliant privacy policy with 7 sections covering data collection, retention table, third-party processors, user rights, and contact information.

### 6.3 Auth Pages (`/signup`, `/login`, `/forgot-password`, `/reset-password`)

All share: centered max-w-md card layout, FormField components, ServerErrorAlert, loading state on submit button.

| Page | Fields | Flow |
|------|--------|------|
| **Signup** | Email, Password (8+ chars, 1 uppercase, 1 number), Confirm Password | `supabase.auth.signUp()` → redirect to onboarding |
| **Login** | Email, Password | `supabase.auth.signInWithPassword()` → redirect to dashboard |
| **Forgot Password** | Email | `supabase.auth.resetPasswordForEmail()` → show confirmation |
| **Reset Password** | New Password, Confirm Password | `supabase.auth.updateUser()` → redirect to dashboard |

**Validation:** Zod schemas on client side. Password requires 8+ characters, 1 uppercase letter, 1 number.

**Navigation:** All pages cross-link (login ↔ signup, login → forgot-password). `?next=` param preserved across auth flow.

### 6.4 Onboarding Page (`/onboarding`)

**Component:** Client component, 2-step animated form

**Step 1 — "Where are you from?"**
- Name (optional text input)
- Nationality (select dropdown, all nationalities)
- Home Airport (AirportCombobox with autocomplete)

**Step 2 — "Your travel style"**
- Travel Style (TravelStylePicker: backpacker/comfort/luxury)
- Interests (ChipGroup: multi-select from 10 interest options)

**Features:**
- StepProgress indicator (Step 1/2 with progress bar)
- Animated slide transitions between steps (Framer Motion slideVariants)
- "Skip for now" link on step 1 → goes directly to `/plan`
- Persists all fields to Zustand store

### 6.5 Dashboard Page (`/dashboard`)

**Component:** Client component (auth-protected via middleware)

**Features:**
- Personalized greeting: "Welcome back, {displayName}"
- Large "Plan a New Trip" CTA card with rotating compass icon on hover
- Trip grid (2 columns) fetched from `GET /api/v1/trips`
- Each trip card: gradient background (4 rotating gradients), status badge, title, metadata (travelers, dates), hover lift effect
- Loading state: 2 SkeletonCard placeholders
- Empty state: EmptyState component with "Start planning" CTA

### 6.6 Plan Page (`/plan`) — Most Complex Page

**Component:** Client component, multi-step questionnaire + AI generation

**Step Count:** 4 steps for guests (includes profile), 2 steps for authenticated users (profile pre-filled)

**Step 3/1 — "Where & when?"**
- Trip type toggle: "One City" / "Multi-City"
- Single-city: CityCombobox autocomplete
- Multi-city: Region selection cards (7 regions)
- Date inputs (start, end) with calculated day count display
- Flexible dates toggle (±3 days)

**Step 4/2 — "Trip details"**
- Budget slider: €1,000 → €30,000 (step=500) with large centered display
- Travelers: +/- counter (range 1-10) with large centered number

**Speculative Route Selection:** When user reaches the trip details step, the page preemptively fires a route selection request to `/api/generate/select-route` and caches the promise. If the user clicks "Generate" before it completes, the generation waits for the cached promise rather than making a duplicate request.

**Generation Loading Screen:**
- Full-screen overlay with animated globe + orbiting airplane
- Dashed outer ring (rotating -360°), inner spinning ring, bobbing globe emoji
- Progress bar with step indicator ("Step X of Y · ~Ns remaining")
- 3-step progress list with emoji labels, pulsing active step, spring-animated checkmarks
- Fun fact carousel rotating every 8 seconds
- Error state: error icon, "Try Again" button, "Back to questionnaire" ghost button

**Generation Flow:**
1. Collect cities (from speculative cache or fresh fetch for multi-city, from destination fields for single-city)
2. Create trip via `POST /api/v1/trips`
3. Set partial itinerary in Zustand (route only, no days)
4. Redirect to `/trip/{id}` where background SSE generation begins

### 6.7 Trip View Page (`/trip/[id]`)

**Component:** Client component with background SSE generation

**Top Bar (fixed):**
- Trip title, metadata (days, countries, budget)
- "Edit" and "Summary" action buttons (hidden during generation)
- Generation spinner when active

**Banners:**
- Generation error: accent background with retry button
- Guest save nudge: "Create a free account to save this itinerary"

**4-Tab Interface:**

| Tab | Content |
|-----|---------|
| **Itinerary** | Expandable day cards grouped by city, activity details with icons, tips, costs. Skeleton placeholders during generation. |
| **Essentials** | Visa requirements with status badges, weather grid, smart packing list with checkboxes |
| **Budget** | Hero total with over/under badge, stacked bar chart, per-city table, adjustment buttons |
| **Map** | MapLibre GL interactive map with numbered markers, dashed route line, click-to-fly |

**Background Generation (SSE):**
- If route exists but `days.length === 0` → fire `POST /api/v1/trips/{id}/generate` as SSE stream
- Events: route → activities → visa → weather → done
- After days populated, enrichment runs in parallel (visa + weather)

### 6.8 Trip Edit Page (`/trip/[id]/edit`)

**Component:** Client component with @dnd-kit drag-and-drop

**Features:**
- **Multi-city:** Drag-and-drop city reordering with grip handles, numbered badges, expandable day adjustment per city, remove button on hover
- **Single-city:** Simple day count +/- control
- Budget impact panel showing recalculated totals
- Floating bottom action bar: Cancel (ghost) + Save Changes (primary)

**Save Logic:**
- Detects edit type: `remove_city`, `reorder_cities`, `adjust_days`
- Recalculates budget proportionally
- Filters days by remaining cities
- Guest mode: updates Zustand only
- Authenticated: `PATCH /api/v1/trips/{id}` with edit metadata

### 6.9 Trip Summary Page (`/trip/[id]/summary`)

**Component:** Client component

**Sections:**
1. **Action row:** BackLink + PDFDownloadButton + "Share Link" button
2. **Title block:** Trip name + date range
3. **Route overview:** Numbered city flow (multi-city) or single destination card
4. **Day-by-day table:** Day | City | Activities (travel indicators for transit days)
5. **Budget summary:** BudgetBreakdown + status message
6. **Visa requirements:** Color-coded entries with "Verify" links to Passport Index
7. **Weather overview:** 2→4 column grid with conditions per city
8. **Flights:** Optimized legs with prices + Skyscanner links, or generic search link
9. **Hotels & Activities:** Affiliate cards (Booking.com, GetYourGuide)
10. **Footer:** "Generated by Travel Pro" with date

**Share Flow:** Fetches share token from API → constructs `/share/{token}` URL → copies to clipboard → toast confirmation

### 6.10 Public Share Page (`/share/[token]`)

**Component:** Server component (fetches from Prisma directly)

**Features:**
- Read-only itinerary view
- Growth CTA banner at top: "Like this itinerary? Plan your own trip in minutes" → `/signup`
- Dynamic metadata for social sharing (OG tags with city names)

### 6.11 Profile Page (`/profile`)

**Component:** Client component (auth-protected)

**Sections:**
1. **Personal:** First name, Nationality dropdown, Home Airport combobox
2. **Travel Style:** TravelStylePicker (compact mode)
3. **Interests:** ChipGroup multi-select
4. **Save button:** Full-width, shows "Saved!" briefly after success
5. **Data & Privacy:**
   - "Download my data (JSON)" — GDPR data export
   - "Delete account" — opens ConfirmDialog with cascade warning

---

## 7. User Journeys

### Journey A: Guest → Plan → View → Share

```
Landing (/) → "Start Planning"
  → Plan (/plan) [4 steps: profile, style, destination, details]
    → Generation loading screen
      → Trip View (/trip/{id}) [4 tabs + background SSE]
        → Edit (/trip/{id}/edit) [drag-drop cities]
        → Summary (/trip/{id}/summary) [PDF, share link, booking CTAs]
          → Share (/share/{token}) [read-only public view]
```

### Journey B: Registered User → Onboarding → Dashboard

```
Signup (/signup) → Email verification
  → Onboarding (/onboarding) [2 steps or skip]
    → Dashboard (/dashboard) [trip list]
      → Plan (/plan) [2 steps: destination, details — profile pre-filled]
        → Trip View → Edit → Summary → Share
```

### Journey C: Returning User

```
Login (/login)
  → Dashboard (/dashboard) [existing trips + "Plan New Trip"]
    → Click trip card → Trip View (/trip/{id})
    → Click "Plan New Trip" → Plan (/plan)
```

### Journey D: Account Management

```
Profile (/profile) → Edit preferences → Save
  → "Download my data" → JSON export
  → "Delete account" → ConfirmDialog → Cascade delete → Redirect to /
```

### Journey E: Password Reset

```
Login → "Forgot password?" → Forgot Password (/forgot-password)
  → Submit email → "Check your inbox" confirmation
    → Email link → Reset Password (/reset-password)
      → Submit new password → Dashboard (/dashboard)
```

---

## 8. Animation System

### Shared Animation Definitions (`src/lib/animations.ts`)

| Variant | Description | Duration | Usage |
|---------|-------------|----------|-------|
| `slideVariants` | Horizontal slide (±300px) with direction param | Instant | Multi-step forms (onboarding, plan) |
| `fadeUp` | Staggered fade + 20px upward slide | 500ms + 150ms stagger | Card grids (features, testimonials) |
| `simpleFadeUp` | Single-element fade + 20px upward slide | 600ms | Individual components |

### Page-Specific Animations

| Page | Animation | Details |
|------|-----------|---------|
| **Landing** | `fadeUp` on scroll (IntersectionObserver) | Feature cards, testimonials, process steps |
| **Onboarding** | `slideVariants` | Step transitions, direction-aware (forward/backward) |
| **Plan** | `slideVariants` + generation animations | Steps slide; loading has rotating globe, orbiting plane, pulsing steps, spring checkmarks |
| **Trip View** | Staggered entrance | Day cards fade in with 20ms stagger delay |
| **Trip Edit** | @dnd-kit transitions | Smooth drag-and-drop reorder animations |
| **CollapsibleSection** | Height 0→auto | AnimatePresence + motion.div, 200ms duration |
| **Toast** | Scale + opacity + Y | `initial={{ opacity: 0, y: 20, scale: 0.95 }}` → visible |

### CSS Animations (Tailwind)

| Class | Effect | Usage |
|-------|--------|-------|
| `animate-pulse` | Opacity fade in/out | Skeleton loaders |
| `animate-spin` | 360° rotation | Loader2 spinner in buttons |

---

## 9. Data Layer & API Integration

### Client-Side Data Fetching Patterns

| Page | Method | Endpoint | Notes |
|------|--------|----------|-------|
| Dashboard | `fetch()` in useEffect | `GET /api/v1/trips` | Falls back to empty state on error |
| Plan (route selection) | `fetch()` speculative | `POST /api/generate/select-route` | Pre-fetched on step entry |
| Plan (trip creation) | `fetch()` on submit | `POST /api/v1/trips` | Creates trip record |
| Trip View (generation) | `EventSource` SSE | `POST /api/v1/trips/{id}/generate` | Background streaming |
| Trip View (enrichment) | `fetch()` parallel | Visa + Weather endpoints | After days generated |
| Trip Edit (save) | `fetch()` on submit | `PATCH /api/v1/trips/{id}` | Sends edit type + payload |
| Summary (share) | `fetch()` on click | `GET /api/v1/trips/{id}/share` | Returns share token |
| Profile (save) | `fetch()` on submit | `PATCH /api/v1/profile` | Upserts profile |
| Profile (export) | `fetch()` → blob | `GET /api/v1/profile/export` | Downloads JSON file |
| Profile (delete) | `fetch()` on confirm | `DELETE /api/v1/profile` | Cascade delete + localStorage clear |

### Providers & Wrappers (`src/components/Providers.tsx`)

```
Providers
├── PostHogProvider (conditional on NEXT_PUBLIC_POSTHOG_KEY)
│   └── QueryClientProvider (staleTime: 60s, retry: 1)
│       ├── CookieConsent
│       └── {children}
└── (no PostHog key)
    └── QueryClientProvider
        ├── CookieConsent
        └── {children}
```

### PostHog Analytics Events

- Consent-gated via `travel_pro_consent` cookie
- `capture_pageview: true`, `capture_pageleave: true`, `autocapture: false`
- Manual events: `questionnaire_completed`, `share_link_created`, `share_link_copied`

---

## 10. Top 10 Frontend Architecture Improvements

### 1. Replace Direct `fetch()` with React Query Mutations & Queries

**Current state:** Most data fetching uses raw `fetch()` in `useEffect` hooks with manual loading/error state management. React Query is installed and configured but barely utilized.

**Recommendation:** Migrate all API calls to `useQuery` and `useMutation` hooks. This provides:
- Automatic cache management and deduplication
- Built-in loading/error/success states (eliminate ~50 local `useState` calls)
- Optimistic updates for edit operations
- Background refetching and stale-while-revalidate
- Retry logic already configured (retry: 1)

**Impact:** Reduces boilerplate by ~30-40% across pages, eliminates race conditions, and provides consistent error handling. The dashboard, trip view, profile, and summary pages would benefit most.

### 2. Extract a Proper Form Management Layer

**Current state:** Forms (signup, login, forgot-password, reset-password, onboarding, plan, profile, edit) all use individual `useState` calls for each field, manual `onChange` handlers, and inline validation. Zod schemas exist on the server but are duplicated or absent on the client.

**Recommendation:** Adopt `react-hook-form` with `@hookform/resolvers/zod` to:
- Unify form state into a single hook per form
- Share Zod schemas between client and server validation
- Get automatic field error tracking and dirty/touched states
- Reduce re-renders (react-hook-form uses uncontrolled inputs by default)

**Impact:** Cleaner form code, single source of truth for validation, reduced re-renders on keystroke, and better accessibility via proper `aria-invalid` attributes.

### 3. Consolidate the Layout and Tab Systems

**Current state:** The tab pattern is implemented three different ways:
- Trip view page: inline tab buttons with `activeTab` state + conditional rendering
- PlanViewLayout: similar inline tab buttons with its own implementation
- Plan page: step-based with `planStep` from Zustand

**Recommendation:** Create a reusable `<Tabs>` compound component (or adopt Radix Tabs):
```tsx
<Tabs defaultValue="itinerary">
  <TabsList>
    <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
    <TabsTrigger value="essentials">Essentials</TabsTrigger>
    <TabsTrigger value="budget">Budget</TabsTrigger>
  </TabsList>
  <TabsContent value="itinerary"><ItineraryTab /></TabsContent>
  ...
</Tabs>
```

**Impact:** Consistent keyboard navigation (arrow keys between tabs), proper ARIA roles (`tablist`, `tab`, `tabpanel`), and reduced duplication across 3+ pages.

### 4. Implement Error Boundaries and Suspense Boundaries

**Current state:** Error handling is ad-hoc — some pages show `ServerErrorAlert`, others use `alert()`, and unhandled errors crash the entire page. No React Error Boundaries exist. Only the signup page uses a Suspense boundary.

**Recommendation:**
- Add `error.tsx` files at each route group level (`(marketing)`, `(auth)`, `(app)`, trip routes)
- Add `loading.tsx` files with consistent skeleton layouts
- Wrap heavy client components (MapLibre, PDF renderer) in Suspense with proper fallbacks
- Create a shared `<ErrorFallback>` component with retry functionality

**Impact:** Graceful degradation — a map crash doesn't take down the entire trip page. Consistent loading states across all routes. Better perceived performance.

### 5. Decouple Page Components — They're Too Large

**Current state:** Several page components are extremely large monoliths:
- `plan/page.tsx` handles 4-step questionnaire + generation loading + speculative fetching + error recovery in a single component
- `trip/[id]/page.tsx` handles tab navigation + SSE generation + enrichment + error banners + guest nudges
- `dashboard/page.tsx` mixes data fetching, trip card rendering, empty states, and loading states

**Recommendation:** Apply the container/presenter pattern:
- Extract each plan step into its own component (`PlanStep1Profile`, `PlanStep2Style`, `PlanStep3Destination`, `PlanStep4Details`)
- Extract the generation loading screen into `<GenerationOverlay>`
- Split trip view into `<TripHeader>`, `<TripBanners>`, `<TripTabContent>` components
- Extract dashboard into `<TripGrid>` and `<NewTripCard>`

**Impact:** Smaller files (~100-200 lines each vs. 500+), easier testing, better code review, and React can optimize re-renders at component boundaries.

### 6. Add Comprehensive Accessibility (a11y) Support

**Current state:** Basic accessibility is present (buttons, links, form labels) but several gaps exist:
- No skip-to-content link
- Combobox components lack `role="combobox"`, `aria-expanded`, `aria-activedescendant`
- Tab navigation doesn't support arrow keys or `role="tablist"` / `role="tab"` semantics
- Map component has no screen reader alternative
- Generation loading screen has no live region announcements
- Budget slider uses a plain `<input type="range">` without `aria-valuetext`
- Drag-and-drop city editor has no keyboard-accessible reorder (though @dnd-kit supports it)

**Recommendation:**
- Add proper ARIA attributes to all interactive patterns (combobox, tabs, dialogs)
- Implement `aria-live="polite"` regions for generation progress updates
- Add skip-to-content link in root layout
- Provide screen reader text for map (list of cities with coordinates)
- Enable @dnd-kit keyboard sensor for city reordering
- Add `aria-valuetext` to budget slider ("Ten thousand euros")

**Impact:** WCAG 2.1 AA compliance, required for EU markets (European Accessibility Act 2025).

### 7. Implement Proper Loading/Skeleton Architecture

**Current state:** Loading states are inconsistent:
- Dashboard: `SkeletonCard` components (good)
- Trip view: `ItinerarySkeletonTab` for generation (good)
- Profile: No loading state at all — renders with stale Zustand data
- Summary: Inline `animate-pulse` divs (inconsistent with Skeleton component)
- Plan: No skeleton for speculative route fetch

**Recommendation:**
- Create `loading.tsx` files for each route (Next.js automatic Suspense)
- Standardize on the `Skeleton`/`SkeletonCard`/`SkeletonText` components everywhere
- Add loading states for profile page (fetch from API, not just Zustand)
- Use streaming with React Server Components where possible

**Impact:** Consistent perceived performance, no layout shifts, and better UX during data fetching.

### 8. Move to Server Components Where Possible

**Current state:** Almost every page is a `"use client"` component, even pages that could benefit from server rendering:
- Landing page — purely presentational, no interactivity needed for initial render
- Privacy page — already a server component (good)
- Share page — already a server component (good)
- Summary page — mostly read-only content

**Recommendation:**
- Convert landing page to server component with client islands (only the animation-dependent sections need `"use client"`)
- Keep summary page mostly server-rendered, wrap only interactive parts (share button, PDF button) in client components
- Use `next/dynamic` with `ssr: false` for heavy client-only modules instead of making entire pages client components

**Benefits:** Smaller client-side JavaScript bundles, faster initial page loads, better SEO, and proper streaming. The landing page alone could shed significant JS by moving animations to CSS or using intersection observer API natively.

### 9. Centralize API Error Handling and Type-Safe Fetching

**Current state:** Each page implements its own `try/catch` around `fetch()` calls with inconsistent error handling:
- Some show `ServerErrorAlert`
- Some set local `error` state with inline display
- Some call `alert()` (the edit page)
- Some silently fail with `console.error`
- Response types are not validated — `await res.json()` is trusted as-is

**Recommendation:**
- Create a typed `apiClient` utility wrapping `fetch()`:
  ```typescript
  const { data, error } = await api.get<Trip[]>('/api/v1/trips')
  const { data, error } = await api.post<Trip>('/api/v1/trips', body)
  ```
- Validate responses with Zod schemas (same ones used server-side)
- Centralize error normalization (HTTP errors, network errors, validation errors)
- Create a shared `useApiError()` hook that maps error codes to user-friendly messages

**Impact:** Consistent error UX, type safety end-to-end, no more `as unknown as Type` casts on the client, and a single place to add auth token refresh or retry logic.

### 10. Add Unit and Integration Tests for Frontend Components

**Current state:** The test infrastructure exists (Vitest configured, Playwright for e2e) but frontend component tests appear minimal or absent. The `src/lib/ai/__tests__/` directory had tests that were deleted.

**Recommendation:**
- Add Vitest + React Testing Library tests for:
  - All UI components (`Button`, `Modal`, `ConfirmDialog`, `Chip`, `AirportCombobox`, etc.)
  - Custom hooks (`useToast`, `useScrollSync`, `useAuthStatus`)
  - Zustand store actions and selectors
  - Utility functions (`deriveCityBudgets`, `generatePackingList`, `trip-metadata`)
  - Form validation (Zod schemas)
- Add integration tests for critical user flows:
  - Plan questionnaire step navigation
  - Budget adjustment calculations
  - City edit/reorder/remove logic
- Target: ~80% coverage for `src/components/ui/` and `src/lib/utils/`

**Impact:** Catches regressions before production, enables confident refactoring (especially for improvements 1-9 above), and documents component behavior for the team.

---

## Summary

Travel Pro's frontend is a well-organized Next.js 16 application with a clear information architecture, thoughtful guest-to-authenticated user flow, and polished UI details (dark mode, animations, loading states, map integration). The component library covers the essential patterns and the Zustand store provides a pragmatic state management layer.

The top areas for improvement center around:
- **Infrastructure** (improvements 1, 2, 4, 9): Replacing manual patterns with library-backed solutions (React Query, react-hook-form, Error Boundaries, typed API client)
- **Architecture** (improvements 3, 5, 8): Breaking down large components, consolidating duplicated patterns, and leveraging server components
- **Quality** (improvements 6, 7, 10): Accessibility compliance, consistent loading states, and test coverage

These improvements would position the codebase for confident scaling while maintaining the already-strong user experience foundation.
