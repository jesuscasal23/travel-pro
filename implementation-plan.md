# Implementation Plan — Phase 0

Phase 0 is the **business partner demo build**. The goal is a working application that demonstrates the Travel Pro concept end-to-end — from profile to itinerary to export — in time for the March 2, 2026 presentation. It is not production-ready. It is a functional prototype built on real infrastructure, so that the work done here carries forward directly into Phase 1 (production MVP) with zero throwaway code.

**Timeline:** February 17 – March 1, 2026 (12 working days)  
**Builder:** 1 full-stack developer  
**Demo scenario:** Thomas & Lena's Asia trip (4–5 weeks, Japan + Vietnam + Thailand, €10,000 budget, comfort style)

> **Design reference:** A fully working UI prototype was built in Lovable (Vite + React + Tailwind) before implementation began. Every screen described in this plan has a concrete, validated design. The production implementation (Next.js) must replicate this design exactly unless noted otherwise. The Lovable source code is in `travel-pro-main.zip` and serves as the definitive visual spec for all Phase 0 screens.

---

## Design System (validated in Lovable prototype)

The following tokens are already implemented in the prototype's `src/index.css` and `tailwind.config.ts`. Replicate them exactly in the Next.js project.

```typescript
// tailwind.config.ts — extend colors
colors: {
  primary: {
    DEFAULT: 'hsl(181 80% 25%)',   // deep teal — #0D7377
    foreground: '#FFFFFF',
  },
  accent: {
    DEFAULT: 'hsl(7 78% 60%)',     // warm coral — #E85D4A (accents only)
    foreground: '#FFFFFF',
  },
  background: '#FFFFFF',
  foreground: 'hsl(0 0% 10%)',     // near-black for headings
  muted: {
    DEFAULT: 'hsl(0 0% 96%)',      // light gray card backgrounds
    foreground: 'hsl(0 0% 40%)',   // medium gray body text
  },
  border: 'hsl(0 0% 90%)',
}
```

**Typography:** Inter (import from Google Fonts). Applied via `font-sans` on `body`.

**Component classes** (copy from prototype's `@layer components`):

```css
.card-travel   { @apply bg-card rounded-xl shadow-card p-6; }
.btn-primary   { @apply bg-primary text-primary-foreground rounded-lg px-6 py-3 font-medium hover:opacity-90 transition-all duration-200; }
.btn-ghost     { @apply bg-transparent text-foreground rounded-lg px-6 py-3 font-medium border border-border hover:bg-muted transition-all duration-200; }
.chip          { @apply px-4 py-2 rounded-full border border-border text-sm font-medium cursor-pointer transition-all duration-200 select-none; }
.chip-selected { @apply bg-primary text-primary-foreground border-primary; }
.badge-success { @apply bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium; }
.badge-warning { @apply bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium; }
.badge-info    { @apply bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-xs font-medium; }
```

**Shadows:**

```css
shadow-card:       0 2px 8px rgba(0,0,0,0.08)
shadow-card-hover: 0 4px 16px rgba(0,0,0,0.12)
shadow-hero:       0 8px 32px rgba(13,115,119,0.25)
```

**Dark mode:** CSS variables for `.dark` are defined in the prototype. Include them but do not prioritise dark mode for the Phase 0 demo.

---

## Infrastructure Setup (Day 1)

Everything in this section is done once and carries forward into Phase 1. Nothing is throwaway.

### 1.1 — Repository & Project Scaffolding

Create the GitHub repository (`travel-pro/travel-pro`). The Lovable prototype used Vite; the production build uses Next.js for SSR and API routes.

```bash
npx create-next-app@latest travel-pro --typescript --tailwind --app --src-dir --use-npm
cd travel-pro
```

Add Prettier + ESLint config (strict TypeScript rules). Add `.env.local.example` with all required environment variable names. Add `.gitignore` for node_modules, .env files, .next, prisma generated client.

Create folder structure: `src/app/`, `src/lib/`, `src/components/`, `src/hooks/`, `src/stores/`, `prisma/`, `tests/`

**Install core dependencies:**

```bash
# UI & animation (same as Lovable prototype)
npm install framer-motion lucide-react
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-slider
npm install @radix-ui/react-tabs @radix-ui/react-collapsible

# State (same as prototype)
npm install zustand

# Map — upgrade from prototype SVG to real Mapbox
npm install react-map-gl mapbox-gl
npm install -D @types/mapbox-gl

# Data & API
npm install @tanstack/react-query zod
npm install @anthropic-ai/sdk
npm install @supabase/supabase-js @upstash/redis
npm install prisma @prisma/client
npm install pino

# Export
npm install @react-pdf/renderer

# Dev
npm install -D vitest @testing-library/react playwright
```

**Estimated time:** 1–2 hours

### 1.2 — Vercel Project Setup

- Connect the GitHub repo to Vercel
- Set up environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ANTHROPIC_API_KEY`
  - `NEXT_PUBLIC_MAPBOX_TOKEN`
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- Enable automatic deployments on push to `main`

**Estimated time:** 30 minutes

### 1.3 — Supabase Project Setup

- Free tier, region: eu-central-1 Frankfurt
- Auth skipped for Phase 0 (no login required for demo)
- Create core tables via Prisma: `profiles`, `trips`, `itineraries`
- Write demo profile + pre-generated itinerary on Day 11 for fallback

**Estimated time:** 1–2 hours

### 1.4 — Upstash Redis Setup

- Free tier, eu-central-1
- Used for caching weather API responses only in Phase 0

**Estimated time:** 15 minutes

### 1.5 — Mapbox Account Setup

- Free tier: 50,000 map loads/month
- Generate access token restricted to Vercel domains + localhost
- Set as `NEXT_PUBLIC_MAPBOX_TOKEN`
- **Note:** The Lovable prototype uses a custom SVG map. Phase 0 upgrades this to real Mapbox GL JS. See Section 7.2 for full implementation.

**Estimated time:** 15 minutes

### 1.6 — Anthropic API Key

- Set as `ANTHROPIC_API_KEY` (server-side only)
- Set $50 monthly spending cap

**Estimated time:** 15 minutes

### 1.7 — External API Keys

- Open-Meteo: no key needed (free). Used live.
- Visa data: hardcoded for Phase 0 (Japan/Vietnam/Thailand, German passport)

**Estimated time:** 30 minutes

**Day 1 Total: ~4–6 hours**

---

## Design System & Base Components (Day 2)

### 2.1 — Tailwind Configuration

Configure `tailwind.config.ts` with the exact tokens from the Lovable prototype (see Design System section above). Copy the `@layer components` classes verbatim from `src/index.css` in the prototype.

**Estimated time:** 1 hour

### 2.2 — Navbar Component

Port `src/components/Navbar.tsx` from the prototype. The navbar has two states:

**Unauthenticated** (landing page): Travel Pro logo left, "Sign In" ghost button right.

**Authenticated** (app pages): Travel Pro logo left, avatar circle + name right with dropdown. Accept `isAuthenticated?: boolean` prop to switch between states. Fixed position, `bg-background/95 backdrop-blur-sm border-b border-border`, height 64px (`h-16`).

**Estimated time:** 1 hour

### 2.3 — Base UI Components

Build using Radix UI primitives + the design tokens above:

- `Button` — primary, ghost variants matching `.btn-primary` and `.btn-ghost`
- `Card` — wraps `.card-travel` with optional hover state
- `Chip` / `ChipGroup` — selectable tags matching `.chip` / `.chip-selected`
- `Badge` — success / warning / info variants
- `ProgressBar` — animated fill, used in onboarding
- `LoadingSpinner` — pulsing circle in primary color

**Estimated time:** 4–5 hours

### 2.4 — Mock Data File

Create `src/data/sampleData.ts` — port directly from the Lovable prototype. This file is the single source of truth for all demo data and is used across every screen. Key exports:

```typescript
export const sampleRoute: CityStop[]    // 7 cities with lat/lng
export const sampleItinerary: TripDay[] // 22 days, full activity depth
export const sampleBudget               // flights/accommodation/activities/food/transport/total/budget
export const sampleVisas                // Japan/Vietnam/Thailand with icons
export const sampleWeather              // 7 cities with temp/condition/icon
export const sampleTrips                // 2 saved trips for dashboard
export const airports                   // 13 airports, LEJ first
export const nationalities              // 16 nationalities, German first
export const interestOptions            // 10 interest chips
export const regions                    // 7 region options for questionnaire
```

The activity depth standard in `sampleItinerary` is the quality bar every AI-generated itinerary must meet. Each `DayActivity` object must include: `name`, `category`, `icon` (emoji), `why`, `duration`, `tip?`, `food?`, `cost?`.

**Estimated time:** 1 hour (direct port from prototype)

**Day 2 Total: ~7–8 hours**

---

## Landing Page (Day 3 — morning)

Create `src/app/(marketing)/page.tsx`. Port directly from `src/pages/Index.tsx` in the Lovable prototype, adapting JSX to Next.js App Router conventions.

### 3.1 — Navbar

`<Navbar />` with `isAuthenticated={false}`. Fixed at top, `z-50`.

### 3.2 — Hero Section

```tsx
<section className="relative pt-32 pb-20 overflow-hidden">
  {/* Background: WorldMapSVG component (port from prototype) */}
  <div className="absolute inset-0"><WorldMapSVG /></div>

  <div className="relative max-w-4xl mx-auto px-4 text-center">
    {/* Framer Motion: opacity+y fade-up, duration 0.7 */}
    <motion.h1
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight"
    >
      Plan your dream trip in minutes, not weeks
    </motion.h1>

    {/* Framer Motion: delay 0.2 */}
    <motion.p
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto"
    >
      AI-powered multi-country trip planning. From idea to optimized itinerary in under 30 minutes.
    </motion.p>

    {/* Framer Motion: delay 0.4 — two buttons side by side */}
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
    >
      <Link href="/onboarding" className="btn-primary text-lg px-10 py-4 shadow-hero">
        Start Planning
      </Link>
      <a href="#how-it-works" className="text-primary font-medium hover:underline">
        See how it works ↓
      </a>
    </motion.div>

    {/* Sub-CTA: delay 0.5 */}
    <motion.p
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-4 text-sm text-muted-foreground"
    >
      Free to use · No credit card required
    </motion.p>

    {/* Social proof: delay 0.6 — 5 colored avatar circles */}
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="mt-12 flex items-center justify-center gap-3"
    >
      <div className="flex -space-x-2">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="w-8 h-8 rounded-full border-2 border-background"
            style={{ background: `hsl(${181 + i * 30} 60% ${45 + i * 8}%)` }} />
        ))}
      </div>
      <span className="text-sm text-muted-foreground font-medium">
        Trusted by 10,000+ travelers
      </span>
    </motion.div>
  </div>
</section>
```

**WorldMapSVG** (`src/components/WorldMapSVG.tsx`): A faint SVG with simplified continent outlines filled `hsl(var(--primary) / 0.04)` and stroked `hsl(var(--primary) / 0.08)`. Port from the prototype.

### 3.3 — Feature Cards Section

```tsx
const features = [
  { emoji: '🧠', title: 'AI Itinerary Generation',
    description: 'Get a complete day-by-day plan tailored to your interests and style' },
  { emoji: '🗺️', title: 'Smart Route Optimization',
    description: 'We calculate the most logical, cost-efficient city order for you' },
  { emoji: '🛂', title: 'Visa & Budget Tracking',
    description: 'Know your visa requirements and estimated costs before you book' },
];

// Stagger animation — custom delay per card
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: 'easeOut' },
  }),
};

<section className="py-20 bg-secondary">
  <div className="max-w-6xl mx-auto px-4">
    <div className="grid md:grid-cols-3 gap-6">
      {features.map((f, i) => (
        <motion.div key={f.title} custom={i} variants={fadeUp}
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="card-travel bg-background hover:shadow-card-hover transition-shadow duration-300"
        >
          <span className="text-3xl">{f.emoji}</span>
          <h3 className="mt-4 text-lg font-semibold text-foreground">{f.title}</h3>
          <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{f.description}</p>
        </motion.div>
      ))}
    </div>
  </div>
</section>
```

### 3.4 — How It Works Section

```tsx
const steps = [
  { icon: UserCircle, label: 'Profile',    description: 'Tell us about your travel style' },
  { icon: CalendarDays, label: 'Plan',     description: 'Choose dates, budget, and destinations' },
  { icon: Plane, label: 'Itinerary',       description: 'Get your optimized itinerary instantly' },
];

<section id="how-it-works" className="py-20">
  <div className="max-w-5xl mx-auto px-4">
    <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-3xl sm:text-4xl font-bold text-center text-foreground">
      How It Works
    </motion.h2>

    <div className="mt-16 grid md:grid-cols-3 gap-8">
      {steps.map((step, i) => (
        <motion.div key={step.label} custom={i} variants={fadeUp}
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-center"
        >
          {/* 64px icon container */}
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <step.icon className="w-8 h-8 text-primary" />
          </div>
          <div className="mt-2 text-xs font-semibold text-primary uppercase tracking-wider">
            Step {i + 1}
          </div>
          <h3 className="mt-3 text-xl font-semibold text-foreground">{step.label}</h3>
          <p className="mt-2 text-muted-foreground text-sm">{step.description}</p>
        </motion.div>
      ))}
    </div>
  </div>
</section>
```

### 3.5 — Footer

```tsx
<footer className="border-t border-border py-12">
  <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
    <span className="text-sm text-muted-foreground">
      © 2026 Travel Pro. AI-powered travel planning.
    </span>
    <div className="flex gap-6">
      {['About', 'Privacy', 'Contact'].map(link => (
        <a key={link} href="#"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          {link}
        </a>
      ))}
    </div>
  </div>
</footer>
```

**Acceptance criteria:** Renders at `/`. Statically generated (no API calls at build time). "Start Planning" links to `/onboarding`. Responsive. All animations use Framer Motion `whileInView` with `once: true`. LCP < 1s.

**Estimated time:** 3–4 hours

---

## Onboarding Flow (Day 3 — afternoon)

Create `src/app/onboarding/page.tsx`. Port from `src/pages/Onboarding.tsx` in the prototype.

### 3.6 — Two-Step Profile Form

**Layout:** Max-width `max-w-lg mx-auto px-4`, top padding `pt-24 pb-12`.

**Progress bar:**

```tsx
<div className="mb-8">
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm font-medium text-muted-foreground">Step {step} of 2</span>
  </div>
  <div className="h-2 bg-secondary rounded-full overflow-hidden">
    {/* Framer Motion animated width: (step/2)*100% */}
    <motion.div className="h-full bg-primary rounded-full"
      animate={{ width: `${(step / 2) * 100}%` }} transition={{ duration: 0.3 }} />
  </div>
</div>
```

**Step 1 — "Where are you from?"**

- Subtext: "This helps us check visa requirements and find the best flights."
- Nationality `<select>` — options from `nationalities` array, default `"German"`
- Home Airport `<select>` — options from `airports` array, default `"LEJ – Leipzig/Halle"`
- Both inputs: `w-full px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring`

**Step 2 — "Tell us about yourself"**

- Subtext: "Your travel style and interests help us personalize your trips."
- Travel style: 3 full-width button cards, each `p-5 rounded-xl border-2 transition-all`. Selected: `border-primary bg-primary/5`. Content: emoji (text-2xl) + label (font-semibold) + description (text-sm text-muted-foreground):
  - 🎒 Backpacker — "Hostels, street food, maximum adventure"
  - 🛏️ Comfort — "3–4 star hotels, mix of local and known restaurants"
  - ✨ Luxury — "5-star properties, fine dining, premium experiences"
- Interests chip grid: `flex flex-wrap gap-3`. Use `.chip` / `.chip-selected` classes. Options from `interestOptions` (10 items).

**Navigation:**

- Back button (left): `flex items-center gap-1 text-sm text-muted-foreground` — opacity-0 on step 1
- Continue/Get Started button (right): `.btn-primary` with ArrowRight icon
- "Skip for now" text link below Continue on step 1 only

**Slide transitions:** `AnimatePresence mode="wait"` with `slideVariants`:

```typescript
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};
```

**State:** Zustand store (`useTripStore`) with `persist` middleware to localStorage. Fields: `onboardingStep`, `nationality`, `homeAirport`, `travelStyle`, `interests[]`. On step 2 completion, navigate to `/plan`.

**Estimated time:** 3–4 hours

**Day 3 Total: ~6–8 hours**

---

## Quick Plan Questionnaire (Day 4)

Create `src/app/plan/page.tsx`. Port from `src/pages/Plan.tsx` in the prototype.

### 4.1 — Layout & Progress Indicator

```tsx
{/* 6 progress dots at top — active dot is wider (w-8 vs w-2.5) */}
<div className="flex items-center justify-center gap-2 mb-10">
  {[1, 2, 3, 4, 5, 6].map(s => (
    <div key={s} className={`h-2.5 rounded-full transition-all duration-300
      ${ s === step ? 'bg-primary w-8' : s < step ? 'bg-primary w-2.5' : 'bg-border w-2.5' }`} />
  ))}
</div>
```

Max-width `max-w-xl mx-auto px-4`, top padding `pt-24 pb-12`.

### 4.2 — Six Question Cards

**Card 1 — "Where do you want to go?"**
Region list from `regions` array (7 options). Each option is a full-width button card: `p-4 rounded-xl border-2`, selected `border-primary bg-primary/5`. Shows `region.name` (font-semibold) + `region.countries` (text-sm text-muted-foreground) + "Popular" badge where `region.popular === true`.

**Card 2 — "How long is your trip?"**
Two `<input type="date">` fields (start + end). Real-time duration display: compute day difference, show in a `bg-primary/5 rounded-lg` box as `text-primary font-semibold text-lg`. Flexible dates toggle using a custom CSS toggle — label: "My dates are flexible (±3 days)".

**Card 3 — "What's your budget?"**
Large budget display: `text-4xl font-bold text-primary` centered. Range slider `min=1000 max=30000 step=500 className="accent-primary"`. Min/max labels below: `€1,000` and `€30,000`. Default: `10000`.

**Card 4 — "What's the vibe?"**
2×2 grid of vibe cards (`grid grid-cols-2 gap-3`), each `p-5 rounded-xl border-2`. Selected: `border-primary bg-primary/5`. Shows emoji (text-2xl), label (font-semibold text-sm mt-2), description (text-xs text-muted-foreground mt-1):

- 🧘 Relaxation — "Beaches, spas, slow mornings"
- 🧗 Adventure — "Hiking, diving, thrill-seeking"
- 🏛️ Cultural — "Museums, temples, local traditions"
- 🎯 Mix of everything — "A balanced blend of all styles"

**Card 5 — "How many travelers?"**
Centered stepper: minus button (w-12 h-12 rounded-full border-2) | count (text-5xl font-bold text-primary w-16 text-center) | plus button. Range 1–10. Default: 2.

**Card 6 — Trip Summary**
Heading "Your trip summary" + subtext. A `.card-travel` showing 5 summary rows (Region / Dates / Budget / Vibe / Travelers), each `flex justify-between py-2 border-b border-border`. Below: full-width `.btn-primary` with Sparkles icon: "Generate My Itinerary".

### 4.3 — Generation Loading Screen

When "Generate" is clicked, replace the entire page with a full-screen loading view:

```tsx
<div className="min-h-screen bg-background flex items-center justify-center">
  <div className="max-w-md w-full px-4">
    <h2 className="text-2xl font-bold text-center">Creating your itinerary</h2>
    <p className="text-muted-foreground text-center mt-2">This usually takes about 30 seconds</p>

    <div className="space-y-4 mt-10">
      {generationSteps.map((gs, i) => (
        // opacity: i <= generationStep ? 1 : 0.3
        // Active step icon container: bg-primary/20 + animate-pulse
        // Completed step: bg-primary/10 + CheckCircle on right
        <motion.div key={i} className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg">
            {gs.emoji}
          </div>
          <span className="font-medium">{gs.label}</span>
        </motion.div>
      ))}
    </div>
  </div>
</div>
```

6 steps, each advancing every 3.5s:

1. 🧭 "Generating your route..."
2. 📅 "Planning daily activities..."
3. 🛂 "Checking visa requirements..."
4. 🌤️ "Analyzing weather patterns..."
5. 💰 "Calculating your budget..."
6. ✅ "Your trip is ready!"

After step 6 completes (+600ms), navigate to `/trip/japan-vietnam-thailand-2026`.

**State management:** All form values in Zustand store. On generation start: `setIsGenerating(true)`, `setGenerationStep(0)`. `useEffect` advances step every 3.5s and navigates on completion.

**Slide transitions between cards:** Same `slideVariants` as onboarding, direction always forward.

**Estimated time:** 6–8 hours

**Day 4 Total: ~6–8 hours**

---

## AI Generation Pipeline (Days 5–6)

### 5.1 — Prompt Template v1

Create `src/lib/ai/prompts/v1.ts`. Output must match the `sampleItinerary` depth standard: each activity needs `name`, `why`, `duration`, `tip`, `food`, `cost`, `category`, `icon` (emoji). See `src/data/sampleData.ts` for the exact quality bar.

**Estimated time:** 3–4 hours

### 5.2 — Generation Pipeline

Create `src/lib/ai/pipeline.ts`. Model: `claude-sonnet-4-20250514`, maxTokens: 8000, temperature: 0.7. Runs synchronously (no queue) for Phase 0.

```typescript
async function generateItinerary(profile, tripIntent): Promise<Itinerary> {
  // Stage 1: Assemble prompt
  const prompt = assemblePrompt(PROMPT_V1, profile, tripIntent);

  // Stage 2: Call Claude
  const rawOutput = await callClaude(prompt, {
    model: 'claude-sonnet-4-20250514',
    maxTokens: 8000,
    temperature: 0.7,
  });

  // Stage 3: Parse + validate
  const parsed = itinerarySchema.parse(JSON.parse(rawOutput));

  // Stage 4: Enrich (parallel)
  const [visaData, weatherData] = await Promise.all([
    enrichVisa(profile.passport_country, parsed.route),
    enrichWeather(parsed.route, tripIntent.date_start),
  ]);

  // Stage 5: Combine + store
  const itinerary = { ...parsed, visa_data: visaData, weather_data: weatherData };
  await storeItinerary(tripIntent.id, itinerary);

  return itinerary;
}
```

**Estimated time:** 3–4 hours

### 5.3 — Visa Enrichment

Hardcoded for Phase 0 — German passport, Japan/Vietnam/Thailand. Interface matches future Travel Buddy API shape.

```typescript
const VISA_DATA_DE = {
  JP: { requirement: 'visa-free', max_stay_days: 90, notes: 'No visa required for stays under 90 days.' },
  VN: { requirement: 'e-visa', max_stay_days: 30, processing_days: 5,
        notes: 'E-visa required. Apply online at least 5 business days before travel.' },
  TH: { requirement: 'visa-free', max_stay_days: 30, notes: 'Visa exemption for stays under 30 days.' },
};
```

**Estimated time:** 1 hour

### 5.4 — Weather Enrichment

Live Open-Meteo API (no key). Cache in Upstash Redis with 7-day TTL. Create `src/lib/ai/enrichment.ts` with `getHistoricalWeather(lat, lng, month)`.

**Estimated time:** 2 hours

### 5.5 — Generation Loading UX

Port the loading screen from `src/pages/Plan.tsx` in the prototype (see Section 4.3 above). Wire to the real pipeline — no UX changes needed.

**Estimated time:** 1 hour

### 5.6 — Quality Testing & Prompt Iteration

Run 5–10 generations against the demo scenario. Every output must match the `sampleItinerary` quality bar. Save the best result to Supabase as the demo fallback.

**Estimated time:** 3–4 hours

**Days 5–6 Total: ~13–16 hours**

---

## Itinerary View — Map + Timeline (Days 7–8)

Create `src/app/trip/[id]/page.tsx`. Port from `src/pages/Trip.tsx` in the prototype, replacing the SVG map with real Mapbox.

### 7.1 — Page Layout

```tsx
<div className="min-h-screen bg-background">
  <Navbar isAuthenticated />

  {/* Fixed top bar — sits below navbar (top-16) */}
  <div className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <h1 className="text-lg font-bold">Japan, Vietnam & Thailand</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground hidden sm:block">
          28 days · 4 countries · Est. €9,200
        </span>
        <Link href={`/trip/${id}/edit`} className="btn-ghost text-sm py-1.5 px-3">
          <Edit3 className="w-3.5 h-3.5" /> Edit
        </Link>
        <Link href={`/trip/${id}/summary`} className="btn-primary text-sm py-1.5 px-3">
          <Download className="w-3.5 h-3.5" /> Export
        </Link>
      </div>
    </div>
  </div>

  {/* Split layout: offset = navbar (64px) + top bar (~56px) = 120px = 7.5rem */}
  <div className="pt-[7.5rem] flex flex-col lg:flex-row min-h-[calc(100vh-7.5rem)]">

    {/* Left panel — 40%, sticky */}
    <div className="lg:w-[40%] bg-secondary p-6 lg:sticky lg:top-[7.5rem] lg:h-[calc(100vh-7.5rem)] overflow-auto">
      <RouteMap
        cities={sampleRoute}
        activeCityIndex={activeCityIndex}
        onCityClick={handleCityClick}
      />
      {/* Collapsible sidebar below map */}
    </div>

    {/* Right panel — 60% */}
    <div className="lg:w-[60%] p-6 lg:p-8">
      {/* Day-by-day timeline */}
    </div>

  </div>
</div>
```

### 7.2 — Route Map Component (Mapbox upgrade)

Create `src/components/map/RouteMap.tsx`. The API (props) stays identical to the prototype so the parent requires no changes. Keep `RouteMapFallback.tsx` (the prototype SVG version) in the codebase as a demo safety net.

```typescript
import Map, { Marker, Popup, Source, Layer, type MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Props — identical to prototype
interface RouteMapProps {
  cities: CityStop[];
  activeCityIndex: number | null;
  onCityClick: (index: number) => void;
}

// Key implementation details:
// - Map style: mapbox://styles/mapbox/light-v11
// - Auto-fit bounds on mount with 80px padding
// - Numbered markers: 32px default, 40px when active, outer ring when active
// - Dashed route line: line-color #0D7377, line-width 2, line-dasharray [2,2], opacity 0.6
// - City popup on marker click: city name, country, days
// - Popup close clears popupIndex but does NOT clear activeCityIndex
```

City coordinates from `sampleRoute`:

| # | City | lat | lng |
|---|------|-----|-----|
| 1 | Tokyo | 35.68 | 139.69 |
| 2 | Kyoto | 35.01 | 135.77 |
| 3 | Hanoi | 21.03 | 105.85 |
| 4 | Ha Long Bay | 20.95 | 107.07 |
| 5 | Bangkok | 13.76 | 100.50 |
| 6 | Chiang Mai | 18.79 | 98.98 |
| 7 | Phuket | 7.88 | 98.39 |

**Estimated time:** 5–6 hours

### 7.3 — Collapsible Info Sidebar (below map, left panel)

**Toggle button:**

```tsx
<button onClick={() => setSidebarOpen(!sidebarOpen)}
  className="w-full flex items-center justify-between text-sm font-semibold text-foreground mb-3">
  Trip Details
  {sidebarOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
</button>
```

**Three tabs:** `["visa", "weather", "budget"]` — pill buttons. Active: `bg-primary text-primary-foreground`. Inactive: `bg-background text-muted-foreground hover:text-foreground`.

**Visa tab:**

```tsx
{sampleVisas.map(visa => (
  <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
    <span className="text-lg">{visa.icon}</span>  {/* ✅ or ⚠️ */}
    <div>
      <div className="text-sm font-medium">{visa.country}</div>
      <div className="text-xs text-muted-foreground">{visa.label}</div>
    </div>
  </div>
))}
// Japan ✅ Visa-free (90 days)
// Vietnam ⚠️ E-visa required (30 days, apply 5 days ahead)
// Thailand ✅ Visa-free (30 days)
```

**Weather tab:**

```tsx
{sampleWeather.map(w => (
  <div className="flex items-center justify-between p-3 bg-background rounded-lg">
    <div className="flex items-center gap-2">
      <span className="text-lg">{w.icon}</span>
      <span className="text-sm font-medium">{w.city}</span>
    </div>
    <div className="text-right">
      <div className="text-sm font-medium">{w.temp}</div>
      <div className="text-xs text-muted-foreground">{w.condition}</div>
    </div>
  </div>
))}
```

**Budget tab — horizontal bar chart:**

```tsx
{Object.entries(sampleBudget)
  .filter(([k]) => k !== 'total' && k !== 'budget')
  .map(([key, value]) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="capitalize">{key}</span>
        <span className="font-medium">€{value.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-background rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full"
          style={{ width: `${(value / sampleBudget.budget) * 100}%` }} />
      </div>
    </div>
  ))}
<div className="pt-3 border-t border-border flex justify-between">
  <span className="font-semibold">Total</span>
  <span className="font-bold">€{sampleBudget.total.toLocaleString()}</span>
</div>
<div className="text-sm text-primary font-medium">
  ✓ €{(sampleBudget.budget - sampleBudget.total).toLocaleString()} under budget
</div>
// flights 2500 | accommodation 3500 | activities 800 | food 1200 | transport 400
// total 8400 | budget 10000
```

### 7.4 — Day-by-Day Timeline (right panel, 60%)

```tsx
<div className="relative">
  {/* Vertical connecting line */}
  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

  <div className="space-y-6">
    {sampleItinerary.map((day, i) => (
      <motion.div
        key={day.day}
        ref={el => { dayRefs.current[i] = el; }}
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.03 }}
        className="relative pl-12"
      >
        {/* City-colored dot on timeline */}
        <div className={`absolute left-2.5 top-3 w-3 h-3 rounded-full ring-2 ring-background
          ${getCityColor(day.city)}`} />
        {/* Color map: Tokyo bg-primary | Kyoto bg-primary/80 | Hanoi bg-accent |
            Ha Long Bay bg-accent/80 | Bangkok bg-primary/60 | Chiang Mai bg-primary/70 | Phuket bg-accent/60 */}

        {/* Travel day banner */}
        {day.isTravel && (
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground bg-secondary rounded-lg px-3 py-2">
            <Plane className="w-4 h-4 text-primary" />
            <span>{day.travelFrom} → {day.travelTo} · {day.travelDuration}</span>
          </div>
        )}

        {/* Day card — ring-2 ring-primary when city is active */}
        <div
          className={`card-travel bg-background cursor-pointer hover:shadow-card-hover transition-all duration-200
            ${ activeCityIndex === sampleRoute.findIndex(c => c.city === day.city)
               ? 'ring-2 ring-primary' : '' }`}
          onClick={() => setActiveCityIndex(sampleRoute.findIndex(c => c.city === day.city))}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">
              Day {day.day} — {day.date} · {day.city}
            </h3>
          </div>

          <div className="space-y-3">
            {day.activities.map((activity, j) => (
              <div key={j} className="flex gap-3">
                <span className="text-lg mt-0.5">{activity.icon}</span>
                <div className="flex-1 min-w-0">
                  {/* Name + duration + cost badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{activity.name}</span>
                    <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {activity.duration}
                    </span>
                    {activity.cost && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {activity.cost}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{activity.why}</p>
                  {activity.tip && (
                    <p className="text-xs text-muted-foreground mt-1 italic">💡 {activity.tip}</p>
                  )}
                  {activity.food && (
                    <p className="text-xs text-muted-foreground mt-1">🍽️ {activity.food}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    ))}
  </div>
</div>
```

**Map-timeline sync:**

```typescript
// Map pin click → scroll timeline to first day for that city
const handleCityClick = useCallback((index: number | null) => {
  setActiveCityIndex(index);
  if (index === null) return;
  const city = sampleRoute[index]?.city;
  const dayIndex = sampleItinerary.findIndex(d => d.city === city);
  if (dayIndex >= 0) {
    dayRefs.current[dayIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}, [setActiveCityIndex]);

// Day card click → highlight map pin
onClick={() => setActiveCityIndex(sampleRoute.findIndex(c => c.city === day.city))}
```

**Estimated time:** 6–8 hours

**Days 7–8 Total: ~11–14 hours** (reduced from original estimate because design is pre-validated)

---

## Edit Mode (Day 8 — afternoon)

Create `src/app/trip/[id]/edit/page.tsx`. Port from `src/pages/TripEdit.tsx` in the prototype.

### 8.1 — Edit Mode Layout

**Top bar:** Same fixed bar pattern as itinerary view. Title: "Edit Trip". Include a `bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full text-xs` "Edit Mode" badge next to the title. Back arrow (`<ArrowLeft />`) links to `/trip/${id}`.

**Content:** `max-w-3xl mx-auto px-4 pb-32`. Wrap city list in `border-2 border-sky-200 rounded-2xl p-6` — the border signals edit mode visually without a full UI shift.

### 8.2 — City Cards

```tsx
{cities.map((city, i) => (
  <motion.div key={city.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <div className="card-travel bg-background flex items-center gap-4 group">

      {/* Drag handle — visual only for Phase 0 */}
      <GripVertical className="w-5 h-5 text-muted-foreground/50 cursor-grab flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <button onClick={() => setExpandedCity(expandedCity === city.city ? null : city.city)}
          className="w-full text-left">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground
              flex items-center justify-center text-xs font-bold">
              {i + 1}
            </span>
            <span className="font-semibold">{city.city}</span>
            <span className="text-muted-foreground text-sm ml-1">
              {city.country} · {city.days} days
            </span>
          </div>
        </button>

        {/* Expandable day count editor */}
        {expandedCity === city.city && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            className="mt-4 pt-4 border-t border-border">
            <label className="text-sm font-medium mb-2 block">Number of days</label>
            <div className="flex items-center gap-3">
              <button onClick={() => updateDays(city.id, -1)}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary">
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xl font-bold text-primary w-8 text-center">{city.days}</span>
              <button onClick={() => updateDays(city.id, +1)}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Remove button — opacity-0, visible on group-hover */}
      <button onClick={() => removeCity(city.id)}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-accent
          opacity-0 group-hover:opacity-100 hover:bg-accent/10 transition-all">
        <X className="w-4 h-4" />
      </button>
    </div>
  </motion.div>
))}

{/* Add city card */}
<button className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center
  text-muted-foreground hover:border-primary hover:text-primary transition-colors">
  <Plus className="w-6 h-6 mx-auto mb-1" />
  <span className="text-sm font-medium">Add a city</span>
</button>
```

### 8.3 — Budget Impact Panel

```tsx
<div className="mt-8 card-travel bg-background">
  <h3 className="font-semibold mb-4">Budget Impact</h3>
  {Object.entries(sampleBudget)
    .filter(([k]) => k !== 'total' && k !== 'budget')
    .map(([k, v]) => (
      <div key={k} className="flex justify-between text-sm">
        <span className="capitalize text-muted-foreground">{k}</span>
        {/* text-accent (coral) signals values may be recalculated */}
        <span className="font-medium text-accent">€{v.toLocaleString()}</span>
      </div>
    ))}
  <div className="pt-2 border-t border-border flex justify-between">
    <span className="font-semibold">Total</span>
    <span className="font-bold text-accent">€{sampleBudget.total.toLocaleString()}</span>
  </div>
</div>
```

### 8.4 — Floating Action Bar

```tsx
<div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4">
  <div className="max-w-3xl mx-auto flex items-center justify-end gap-3">
    <Link href={`/trip/${id}`} className="btn-ghost text-sm py-2 px-4">Cancel</Link>
    <Link href={`/trip/${id}`} className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
      <Save className="w-4 h-4" /> Save Changes
    </Link>
  </div>
</div>
```

**Estimated time:** 3–4 hours

---

## Dashboard (Day 8 — morning)

Create `src/app/dashboard/page.tsx`. Port from `src/pages/Dashboard.tsx` in the prototype.

```tsx
<div className="pt-24 pb-16 max-w-5xl mx-auto px-4">

  {/* Greeting */}
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
    <h1 className="text-3xl font-bold text-foreground">Welcome back, Thomas.</h1>
    <p className="text-muted-foreground mt-1">Ready for your next adventure?</p>
    {/* Derive display name from Zustand store; default to "Thomas" for demo */}
  </motion.div>

  {/* Plan New Trip CTA */}
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
    <Link href="/plan"
      className="block w-full max-w-md mx-auto text-center bg-primary text-primary-foreground
        rounded-2xl py-6 px-8 shadow-hero hover:shadow-xl hover:scale-[1.02] transition-all group mt-10">
      <Compass className="w-10 h-10 mx-auto mb-3 group-hover:rotate-45 transition-transform duration-500" />
      <span className="text-xl font-semibold">Plan a New Trip</span>
    </Link>
  </motion.div>

  {/* Trips grid */}
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
    className="mt-14">
    <h2 className="text-xl font-semibold text-foreground mb-6">Your Trips</h2>
    <div className="grid sm:grid-cols-2 gap-6">
      {sampleTrips.map((trip, i) => (
        <Link key={trip.id} href={`/trip/${trip.id}`} className="group block">
          <div className={`relative rounded-xl overflow-hidden bg-gradient-to-br
            ${i === 0 ? 'from-primary/80 to-primary/40' : 'from-accent/80 to-accent/40'}
            h-48 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300`}>
            <div className="absolute inset-0 bg-foreground/10" />
            <div className="relative h-full flex flex-col justify-between p-6 text-primary-foreground">
              <span className={`${statusColors[trip.status]} text-xs self-start`}>{trip.status}</span>
              <div>
                <h3 className="text-lg font-bold">{trip.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-sm opacity-90">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {trip.countries} countries</span>
                  <span className="flex items-center gap-1"><Plane className="w-3.5 h-3.5" /> {trip.dates}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  </motion.div>
</div>
```

**Note:** Do not hardcode "Alex". Derive from Zustand store — use `store.nationality` to determine a display name, or default to "Thomas" for the demo scenario if store is empty.

**Estimated time:** 2–3 hours

---

## Export & Summary (Day 9)

Create `src/app/trip/[id]/summary/page.tsx`. Port from `src/pages/TripSummary.tsx` in the prototype, then wire up PDF and Share Link.

### 9.1 — Summary Page

```tsx
<div className="pt-24 pb-16 max-w-3xl mx-auto px-4">

  {/* Top action row */}
  <div className="flex items-center justify-between mb-8">
    <Link href={`/trip/${id}`} className="text-sm text-muted-foreground hover:text-foreground">
      ← Back to itinerary
    </Link>
    <div className="flex gap-3">
      <PDFDownloadButton />
      <button onClick={handleShareLink} className="btn-ghost text-sm py-2 px-4 flex items-center gap-1.5">
        <Share2 className="w-4 h-4" /> Share Link
      </button>
    </div>
  </div>

  {/* Title block */}
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
    <h1 className="text-3xl font-bold text-foreground">Japan, Vietnam & Thailand</h1>
    <p className="text-muted-foreground mt-1">Oct 1 – Oct 28, 2026 · 28 days · 2 travelers</p>
  </motion.div>

  {/* Route overview card */}
  <div className="mt-8 card-travel bg-background">
    <h2 className="font-semibold text-foreground mb-4">Route</h2>
    <div className="flex items-center gap-2 flex-wrap">
      {sampleRoute.map((city, i) => (
        <div key={city.id} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground
              flex items-center justify-center text-xs font-bold">{i + 1}</span>
            <span className="text-sm font-medium">{city.city}</span>
            <span className="text-xs text-muted-foreground">({city.days}d)</span>
          </div>
          {i < sampleRoute.length - 1 && <Plane className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      ))}
    </div>
  </div>

  {/* Day-by-day compact table */}
  <div className="mt-8">
    <h2 className="font-semibold text-foreground mb-4">Day-by-Day Plan</h2>
    <div className="border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-secondary">
            <th className="text-left px-4 py-3 font-medium">Day</th>
            <th className="text-left px-4 py-3 font-medium">City</th>
            <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Activities</th>
          </tr>
        </thead>
        <tbody>
          {sampleItinerary.map(day => (
            <tr key={day.day} className="border-t border-border">
              <td className="px-4 py-3 text-muted-foreground font-mono">{day.day}</td>
              <td className="px-4 py-3 font-medium">{day.city}</td>
              <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                {day.isTravel && (
                  <span className="text-primary text-xs mr-2">✈ {day.travelFrom} → {day.travelTo}</span>
                )}
                {day.activities.map(a => a.name).join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>

  {/* Budget summary card */}
  {/* Visa checklist card */}
  {/* Weather overview — grid grid-cols-2 sm:grid-cols-4 gap-3, each cell text-center p-3 bg-secondary rounded-lg */}
  {/* Book Your Trip — grid sm:grid-cols-3 gap-3, border border-border rounded-xl p-4 hover:border-primary */}

  {/* Footer */}
  <div className="mt-12 text-center text-sm text-muted-foreground">
    <p>Generated by Travel Pro — travelpro.app</p>
    <p>Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  </div>
</div>
```

**Share Link handler:**

```typescript
const handleShareLink = () => {
  navigator.clipboard.writeText(`${window.location.origin}/trip/${id}`);
  toast({ title: 'Link copied!', description: 'Share link copied to clipboard ✅' });
};
```

### 9.2 — PDF Export

Create `src/components/export/PDFDownloadButton.tsx`:

```tsx
import { PDFDownloadLink } from '@react-pdf/renderer';
import { TripPDFDocument } from '@/lib/export/pdf-generator';

export function PDFDownloadButton() {
  return (
    <PDFDownloadLink
      document={<TripPDFDocument />}
      fileName="TravelPro-Japan-Vietnam-Thailand.pdf"
    >
      {({ loading }) => (
        <button className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
          <Download className="w-4 h-4" />
          {loading ? 'Generating PDF...' : 'Download PDF'}
        </button>
      )}
    </PDFDownloadLink>
  );
}
```

Create `src/lib/export/pdf-generator.tsx` using `@react-pdf/renderer`. The PDF uses its own StyleSheet (not Tailwind). Must include:

- Branded header: "Travel Pro" in teal + generation date
- Route map image: Mapbox Static Images API PNG (all 7 city pins, auto-fit bounds)
  ```
  https://api.mapbox.com/styles/v1/mapbox/light-v11/static/
    pin-s-1+0D7377(139.69,35.68),...
  /auto/800x300@2x?padding=60&access_token=TOKEN
  ```
- Day-by-day compact table (all 22 days; travel days highlighted)
- Visa requirements table
- Weather overview table
- Budget breakdown table with bold total + "under budget" line
- Booking links section: Skyscanner, Booking.com, GetYourGuide (clickable URLs)
- Footer on every page: "Generated by Travel Pro — travelpro.app · Page N of M"
- File downloads as `TravelPro-Japan-Vietnam-Thailand.pdf`

**Estimated time:** 7–9 hours

**Day 9 Total: ~7–9 hours**

---

## Polish, Testing & Demo Preparation (Days 10–12)

### Day 10: End-to-End Flow Polish

- Walk through the entire flow: Landing → Onboarding → Quick Plan → Loading → Itinerary View → Edit → Summary → PDF
- Fix visual bugs, spacing issues, mobile responsiveness
- Test on Chrome, Firefox, Safari, and one mobile device
- Verify all Framer Motion animations match the prototype (entrance delays, slide transitions, stagger)
- Verify Mapbox map renders and syncs correctly with the timeline

**Estimated time:** 6–8 hours

### Day 11: Demo Hardening

- Pre-generate the Thomas & Lena demo itinerary and save to Supabase as fallback
- Test LLM pipeline 5+ times for quality and reliability
- Write and rehearse the demo script (Landing → full flow)
- Record backup demo video
- Test PDF download on multiple devices

**Estimated time:** 6–8 hours

### Day 12: Buffer / Final Rehearsal

- Spillover fixes
- Final Vercel production deployment
- One full demo rehearsal end-to-end

**Estimated time:** 4–6 hours

**Days 10–12 Total: ~16–22 hours**

---

## Phase 0 Cost Breakdown

| Service | Tier | Monthly Cost | Notes |
|---|---|---|---|
| Vercel | Hobby (free) or Pro | $0–$20 | Hobby sufficient. Upgrade to Pro ($20) only if 10s timeout is too tight for LLM generation. |
| Supabase | Free | $0 | 500MB database — more than enough. |
| Upstash Redis | Free | $0 | 10,000 commands/day — sufficient for weather caching. |
| Anthropic (Claude Sonnet) | Pay-per-use | $5–$15 | ~$0.09 per generation. Set $20 hard cap. |
| Mapbox | Free | $0 | 50,000 map loads/month. Phase 0 uses <500. |
| Open-Meteo | Free | $0 | No API key needed. |
| Domain (optional) | Registration | $10–$15 one-time | Vercel subdomain sufficient for demo. |

**Phase 0 Total: ~$5–$35/month**

---

## Phase 0 Schedule Summary

| Day | Date | Focus | Deliverable |
|---|---|---|---|
| 1 | Feb 18 (Tue) | Infrastructure | Repo, Vercel, Supabase, Redis, API keys — all deploying |
| 2 | Feb 19 (Wed) | Design system + mock data | Tailwind tokens, component classes, Navbar, sampleData.ts ported from prototype |
| 3 | Feb 20 (Thu) | Landing page + onboarding | `/` and `/onboarding` live, matching prototype design exactly |
| 4 | Feb 21 (Fri) | Quick Plan questionnaire | Full 6-card flow with animations and generation loading sequence |
| 5 | Feb 24 (Mon) | AI pipeline — prompt + generation + visa | Claude generating complete itineraries, visa enrichment working |
| 6 | Feb 25 (Tue) | AI pipeline — weather + quality | Weather enrichment, prompt quality validated against sampleData depth bar |
| 7 | Feb 26 (Wed) | Itinerary view — Mapbox map + dashboard | Real Mapbox map with pins and route, dashboard page live |
| 8 | Feb 27 (Thu) | Itinerary view — timeline + sidebar + edit mode | Day-by-day cards, visa/weather/budget panels, map sync, edit mode |
| 9 | Feb 28 (Fri) | Summary page + PDF export | Summary page, working PDF download, share link with toast |
| 10 | Mar 1 (Sat) | Polish + responsive | Full flow polished, cross-browser tested |
| 11 | Mar 1 (Sat) | Demo hardening | Fallback itinerary cached, demo script ready, backup video recorded |
| 12 | Mar 2 (Sun) | Buffer / rehearsal | Final deployment, full demo rehearsal |

*Note: Days 10–12 fall on a weekend. Most expendable items if time runs short: PDF export (show summary page instead), drag-and-drop in edit mode (remove buttons still work).*

---

## What Carries Forward to Phase 1

| Phase 0 Component | Phase 1 Enhancement |
|---|---|
| Next.js project + Vercel deployment | Same pipeline, no changes |
| Tailwind design system + component classes | Reused as-is, extended with new components |
| `sampleData.ts` | Replaced by live Supabase + AI output; file deleted |
| Landing page | Add testimonials, SEO meta, blog link |
| Onboarding (2-step) | Add Supabase Auth, extend to full 4-step with progressive profiling |
| Quick Plan questionnaire | Make region/country fields dynamic, add free-text country search |
| AI generation pipeline | Add BullMQ async queue, SSE progress, Haiku fallback, output caching |
| Prompt template v1 | A/B test v1 vs v2 via PostHog feature flags |
| Visa enrichment (hardcoded) | Replace with live Travel Buddy API |
| Weather enrichment (live) | Already production-ready |
| Mapbox RouteMap component | Add pin clustering, Explore mode (interactive destination pinning) |
| Day-by-day timeline | Add drag-and-drop reordering (dnd-kit), cascading budget recalculation |
| Edit mode | Wire Save to AI regeneration endpoint, not just navigation |
| Summary page + PDF | Real affiliate deep links, server-side PDF generation, share link persistence |

---

## Risk Mitigation for the Demo

**Risk: LLM call fails during live demo.**  
Mitigation: Pre-generate and cache a high-quality itinerary in Supabase. The app checks for a cached result first. During the demo, the loading sequence plays against the cached version.

**Risk: LLM output quality is poor.**  
Mitigation: Run 10+ generations before the demo, save the best one. The `sampleData.ts` quality bar is the acceptance criteria — reject any output that doesn't match it.

**Risk: Mapbox fails to render.**  
Mitigation: `RouteMapFallback.tsx` (the SVG version from the Lovable prototype) is a drop-in replacement. Keep it in the codebase and swap the import in `Trip.tsx` if Mapbox has issues during the demo.

**Risk: Vercel deployment fails.**  
Mitigation: Deploy 24 hours before the demo. Keep the last working deployment pinned. Have the backup demo video ready.

**Risk: Generation takes >30 seconds.**  
Mitigation: Cached fallback loads instantly. Upgrade to Vercel Pro ($20) for 60s timeout if needed.