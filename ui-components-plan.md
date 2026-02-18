# UI Component Implementation Plan
**Travel Pro — Phase 0 Code Reuse Audit**
*Prepared: 2026-02-18*

---

## Executive Summary

After auditing all 7 pages and 13 existing components, this plan identifies **17 new components** to extract from repeated inline patterns, grouped into 4 tiers by impact. The goal is to eliminate duplication, improve consistency, and make future page-building significantly faster.

**Current state**: pages contain ~60% inline JSX patterns duplicated across 2–4 files.
**Target state**: pages compose components; no style strings duplicated across files.

---

## What Already Exists (Keep As-Is)

The current `src/components/ui/` layer is solid and should not be changed — only extended.

| Component | Status | Issue |
|-----------|--------|-------|
| `Button` (primary/ghost) | ✅ Good | — |
| `Card` (hoverable) | ⚠ Underused | Pages still write `className="card-travel"` directly |
| `Chip` / `ChipGroup` | ✅ Good | Only used in onboarding — should be used for interests elsewhere |
| `Badge` (success/warning/info) | ✅ Good | — |
| `ProgressBar` (animated) | ⚠ Underused | Onboarding re-implements it manually at line 92 |
| `LoadingSpinner` | ✅ Good | — |
| `Toast` / `ToastContainer` | ✅ Good | — |
| `Navbar` | ✅ Good | — |

**Quick fixes (no new components needed):**
- `onboarding/page.tsx:92` — replace manual progress bar with `<ProgressBar>`
- All pages — replace `className="card-travel"` with `<Card>`

---

## Repeated Patterns Found

### Pattern 1 — Input class string (3 occurrences)
```tsx
// onboarding/page.tsx:78, plan/page.tsx:256, plan/page.tsx:268
"w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
```

### Pattern 2 — SelectionCard button (3 occurrences)
```tsx
// onboarding/page.tsx:188 (travel styles)
// plan/page.tsx:226     (region selection)
// plan/page.tsx:331     (vibe selection)
<button className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200
  ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
  <span className="text-2xl">{emoji}</span>
  <div className="font-semibold">{label}</div>
  <div className="text-sm text-muted-foreground">{description}</div>
</button>
```

### Pattern 3 — Step title + description (6 occurrences across 2 files)
```tsx
<h2 className="text-2xl font-bold text-foreground mb-1">{title}</h2>
<p className="text-muted-foreground mb-6">{description}</p>
```

### Pattern 4 — Back/Continue wizard navigation (2 files, identical DOM)
Identical structure in `onboarding/page.tsx:228` and `plan/page.tsx:405`.

### Pattern 5 — Key-value data rows (3 files)
```tsx
// plan/page.tsx:382 (summary card)
// trip/[id]/page.tsx:181 (budget sidebar)
// trip/[id]/summary/page.tsx:166 (budget breakdown)
<div className="flex justify-between py-3 border-b border-border">
  <span className="text-muted-foreground">{label}</span>
  <span className="font-medium text-foreground">{value}</span>
</div>
```

### Pattern 6 — Budget breakdown with optional progress bars (2 files)
`trip/[id]/page.tsx:175–207` and `trip/[id]/summary/page.tsx:154–181` — same data, same structure.

### Pattern 7 — Visa info rows (2 files)
`trip/[id]/page.tsx:137–150` and `trip/[id]/summary/page.tsx:191–207` — same row structure.

### Pattern 8 — Weather cards (2 files)
`trip/[id]/page.tsx:154–170` and `trip/[id]/summary/page.tsx:216–226` — same data, different layout.

### Pattern 9 — Custom Toggle/Switch (1 file, generic)
`plan/page.tsx:279–292` — inline toggle, needs accessibility attributes.

### Pattern 10 — NumberStepper (1 file, generic)
`plan/page.tsx:349–362` — ±1 stepper with min/max clamping.

### Pattern 11 — Dot/pill step progress (1 file)
`plan/page.tsx:196–204` — pills that expand when active, shrink when past.

### Pattern 12 — Collapsible section (1 file)
`trip/[id]/page.tsx:99–111` — header button + ChevronUp/Down + animated body.

### Pattern 13 — Tab bar (1 file)
`trip/[id]/page.tsx:119–133` — pill-style tabs with active/inactive states.

### Pattern 14 — Activity item (1 file, 30+ lines inline)
`trip/[id]/page.tsx:263–295` — emoji, name, duration badge, cost badge, why, tip, food.

### Pattern 15 — Travel day banner (1 file)
`trip/[id]/page.tsx:239–246` — ✈ from→to · duration strip.

### Pattern 16 — Page layout shell (all 7 pages)
Every page: `min-h-screen bg-background` + `<Navbar>` + offset content area with inconsistent `pt-24` vs `pt-[7.5rem]`.

---

## New Components to Build

---

### Tier 1 — Core Form Controls

#### 1. `Input` + `Select`
**Files**: `src/components/ui/Input.tsx`, `src/components/ui/Select.tsx`
**Eliminates**: Pattern 1

Thin `forwardRef` wrappers that bake in the standard input class. Consumers no longer need to know the class string.

```tsx
// Input.tsx
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full px-4 py-3 rounded-lg border border-input bg-background
        focus:outline-none focus:ring-2 focus:ring-ring text-foreground ${className}`}
      {...props}
    />
  )
);

// Select.tsx — identical but <select> element
```

---

#### 2. `FormField`
**File**: `src/components/ui/FormField.tsx`
**Eliminates**: Repeated `<label>` + input stacking pattern

```tsx
interface FormFieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}
// Renders: label → children → optional hint
```

**Pages updated**: `onboarding/page.tsx`, `plan/page.tsx`

---

#### 3. `SelectionCard`
**File**: `src/components/ui/SelectionCard.tsx`
**Eliminates**: Pattern 2 (3 instances — the most repeated interactive pattern)

```tsx
interface SelectionCardProps {
  emoji?: string;
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  layout?: "horizontal" | "vertical"; // horizontal: emoji+text side by side; vertical: stacked
  badge?: React.ReactNode;            // e.g. <Badge variant="info">Popular</Badge>
  className?: string;
}
```

The `layout` prop handles both the onboarding style (emoji left, text right) and the plan/vibe style (emoji top, text below).

**Pages updated**: `onboarding/page.tsx`, `plan/page.tsx` (steps 1, 2, 4)

---

#### 4. `Toggle`
**File**: `src/components/ui/Toggle.tsx`
**Eliminates**: Pattern 9

```tsx
interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  id?: string;
}
```

Accessible: `role="switch"`, `aria-checked`, Space key support. Encapsulates the track + knob animation.

**Pages updated**: `plan/page.tsx` (flexible dates)

---

#### 5. `NumberStepper`
**File**: `src/components/ui/NumberStepper.tsx`
**Eliminates**: Pattern 10

```tsx
interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  displaySize?: "sm" | "lg"; // lg = text-5xl hero display (plan page)
}
```

**Pages updated**: `plan/page.tsx` (traveler count)

---

### Tier 2 — Navigation & Layout

#### 6. `StepHeader`
**File**: `src/components/ui/StepHeader.tsx`
**Eliminates**: Pattern 3 (6 occurrences)

```tsx
interface StepHeaderProps {
  title: string;
  description?: string;
}
// Renders: <h2 className="text-2xl font-bold ..."> + <p className="text-muted-foreground ...">
```

**Pages updated**: `onboarding/page.tsx`, `plan/page.tsx`

---

#### 7. `WizardNav`
**File**: `src/components/ui/WizardNav.tsx`
**Eliminates**: Pattern 4 (2 files, identical DOM)

```tsx
interface WizardNavProps {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;       // default: "Continue"
  nextDisabled?: boolean;
  hideBack?: boolean;
  skipLabel?: string;       // renders "Skip for now" text link if provided
  onSkip?: () => void;
}
```

Renders the full `mt-8 flex items-center justify-between` navigation block including the optional skip link below.

**Pages updated**: `onboarding/page.tsx`, `plan/page.tsx`

---

#### 8. `StepDots`
**File**: `src/components/ui/StepDots.tsx`
**Eliminates**: Pattern 11

```tsx
interface StepDotsProps {
  total: number;
  current: number; // 1-indexed
  className?: string;
}
// active dot = w-8 bg-primary pill, past = w-2.5 bg-primary, future = w-2.5 bg-border
```

**Pages updated**: `plan/page.tsx`

---

#### 9. `PageLayout`
**File**: `src/components/layout/PageLayout.tsx`
**Eliminates**: Pattern 16 (boilerplate on all 7 pages)

```tsx
interface PageLayoutProps {
  authenticated?: boolean;
  displayName?: string;
  children: React.ReactNode;
  contentClass?: string; // default: "pt-24 pb-16 max-w-5xl mx-auto px-4"
}
// Renders: min-h-screen bg-background + <Navbar> + <main contentClass>
```

Standardises the `pt-24` offset (currently inconsistent: `pt-24` vs `pt-[7.5rem]`).

**Pages updated**: all 7 pages

---

#### 10. `SectionHeader`
**File**: `src/components/ui/SectionHeader.tsx`
**Eliminates**: inline `<h2 className="font-semibold text-foreground mb-4">` across summary/dashboard

```tsx
interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode; // optional right-aligned button/link
  className?: string;
}
```

**Pages updated**: `trip/[id]/summary/page.tsx`, `dashboard/page.tsx`

---

### Tier 3 — Data Display Components

#### 11. `DataRow` + `DataList`
**File**: `src/components/ui/DataRow.tsx`
**Eliminates**: Pattern 5 (3 files)

```tsx
interface DataRowProps {
  label: string;
  value: React.ReactNode;
  bordered?: boolean; // adds border-b border-border (default: true)
}

interface DataListProps {
  rows: Array<{ label: string; value: React.ReactNode }>;
  className?: string;
}
// DataList renders a sequence of DataRows, last row has no border
```

**Pages updated**: `plan/page.tsx`, `trip/[id]/summary/page.tsx`

---

#### 12. `BudgetBreakdown`
**File**: `src/components/trip/BudgetBreakdown.tsx`
**Eliminates**: Pattern 6 (duplicate rendering in 2 files)

```tsx
interface BudgetBreakdownProps {
  budget: TripBudget;
  showProgressBars?: boolean; // true = trip sidebar, false = summary page
}
// Always shows total row + budget status line ("✓ under budget" / "⚠ over budget")
```

**Pages updated**: `trip/[id]/page.tsx`, `trip/[id]/summary/page.tsx`

---

#### 13. `VisaItem`
**File**: `src/components/trip/VisaItem.tsx`
**Eliminates**: Pattern 7 (2 files)

```tsx
interface VisaItemProps {
  visa: VisaInfo;
  showNotes?: boolean; // summary page shows notes; sidebar does not
}
```

**Pages updated**: `trip/[id]/page.tsx`, `trip/[id]/summary/page.tsx`

---

#### 14. `WeatherCard`
**File**: `src/components/trip/WeatherCard.tsx`
**Eliminates**: Pattern 8 (2 files)

```tsx
interface WeatherCardProps {
  weather: CityWeather;
  layout?: "row" | "tile"; // row = sidebar horizontal list, tile = summary grid
}
```

**Pages updated**: `trip/[id]/page.tsx`, `trip/[id]/summary/page.tsx`

---

### Tier 4 — Trip View Components

#### 15. `ActivityItem`
**File**: `src/components/trip/ActivityItem.tsx`
**Eliminates**: Pattern 14 (30+ lines of inline JSX in trip page)

```tsx
interface ActivityItemProps {
  activity: DayActivity;
}
// Renders: emoji icon, name, duration badge (Clock), cost badge, why text, tip (💡), food (🍽️)
```

**Pages updated**: `trip/[id]/page.tsx`

---

#### 16. `TravelBanner`
**File**: `src/components/trip/TravelBanner.tsx`
**Eliminates**: Pattern 15

```tsx
interface TravelBannerProps {
  from: string;
  to: string;
  duration: string;
}
// Renders the teal-plane travel strip: bg-secondary rounded-lg px-3 py-2 flex items-center gap-2
```

**Pages updated**: `trip/[id]/page.tsx`

---

#### 17. `CollapsibleSection`
**File**: `src/components/ui/CollapsibleSection.tsx`
**Eliminates**: Pattern 12

```tsx
interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}
// Manages open/close state internally. Framer Motion height animation.
```

**Pages updated**: `trip/[id]/page.tsx`

---

#### 18. `TabBar`
**File**: `src/components/ui/TabBar.tsx`
**Eliminates**: Pattern 13

```tsx
interface TabBarProps<T extends string> {
  tabs: T[];
  active: T;
  onChange: (tab: T) => void;
  variant?: "pill" | "underline"; // pill = current sidebar style
}
// Generic typed tab bar. Active: bg-primary text-primary-foreground. Inactive: text-muted-foreground.
```

**Pages updated**: `trip/[id]/page.tsx`

---

## Summary Table

| # | Component | Tier | File Location | Instances Removed |
|---|-----------|------|---------------|-------------------|
| 1 | `Input` | 1 | `ui/Input.tsx` | 3 |
| 2 | `Select` | 1 | `ui/Select.tsx` | 2 |
| 3 | `FormField` | 1 | `ui/FormField.tsx` | 4 |
| 4 | `SelectionCard` | 1 | `ui/SelectionCard.tsx` | **3** ← highest |
| 5 | `Toggle` | 1 | `ui/Toggle.tsx` | 1 |
| 6 | `NumberStepper` | 1 | `ui/NumberStepper.tsx` | 1 |
| 7 | `StepHeader` | 2 | `ui/StepHeader.tsx` | **6** ← highest |
| 8 | `WizardNav` | 2 | `ui/WizardNav.tsx` | 2 |
| 9 | `StepDots` | 2 | `ui/StepDots.tsx` | 1 |
| 10 | `PageLayout` | 2 | `layout/PageLayout.tsx` | **7** ← highest |
| 11 | `SectionHeader` | 2 | `ui/SectionHeader.tsx` | 5 |
| 12 | `DataRow` + `DataList` | 3 | `ui/DataRow.tsx` | 3 |
| 13 | `BudgetBreakdown` | 3 | `trip/BudgetBreakdown.tsx` | 2 |
| 14 | `VisaItem` | 3 | `trip/VisaItem.tsx` | 2 |
| 15 | `WeatherCard` | 3 | `trip/WeatherCard.tsx` | 2 |
| 16 | `ActivityItem` | 4 | `trip/ActivityItem.tsx` | 1 (30+ lines) |
| 17 | `TravelBanner` | 4 | `trip/TravelBanner.tsx` | 1 |
| 18 | `CollapsibleSection` | 4 | `ui/CollapsibleSection.tsx` | 1 |
| 19 | `TabBar` | 4 | `ui/TabBar.tsx` | 1 |

**Total: 19 new files** | **~40 inline pattern removals**

---

## Recommended Build Order

```
Phase A — Tier 1+2 (form controls + navigation):
  Input, Select, FormField
  SelectionCard
  Toggle, NumberStepper
  StepHeader, WizardNav, StepDots
  PageLayout, SectionHeader
  → Refactor: onboarding/page.tsx, plan/page.tsx

Phase B — Tier 3 (data display):
  DataRow, DataList
  BudgetBreakdown
  VisaItem, WeatherCard
  → Refactor: trip/[id]/page.tsx, trip/[id]/summary/page.tsx

Phase C — Tier 4 (trip view):
  ActivityItem, TravelBanner
  CollapsibleSection, TabBar
  → Refactor: trip/[id]/page.tsx (clean sweep)

Phase D — Housekeeping:
  Update src/components/ui/index.ts
  Create src/components/trip/index.ts
  Create src/components/layout/index.ts
  Fix: use <ProgressBar> in onboarding (remove manual re-implementation)
  Fix: use <Card> component instead of className="card-travel" in pages
```

---

## Final File Structure

```
src/components/
├── ui/
│   ├── Button.tsx              (existing)
│   ├── Card.tsx                (existing)
│   ├── Chip.tsx                (existing)
│   ├── Badge.tsx               (existing)
│   ├── ProgressBar.tsx         (existing)
│   ├── LoadingSpinner.tsx      (existing)
│   ├── Toast.tsx               (existing)
│   ├── Input.tsx               ← NEW
│   ├── Select.tsx              ← NEW
│   ├── FormField.tsx           ← NEW
│   ├── SelectionCard.tsx       ← NEW (highest impact)
│   ├── Toggle.tsx              ← NEW
│   ├── NumberStepper.tsx       ← NEW
│   ├── StepHeader.tsx          ← NEW
│   ├── StepDots.tsx            ← NEW
│   ├── WizardNav.tsx           ← NEW
│   ├── SectionHeader.tsx       ← NEW
│   ├── DataRow.tsx             ← NEW
│   ├── CollapsibleSection.tsx  ← NEW
│   ├── TabBar.tsx              ← NEW
│   └── index.ts                (update)
├── layout/
│   ├── PageLayout.tsx          ← NEW
│   └── index.ts                ← NEW
├── trip/
│   ├── BudgetBreakdown.tsx     ← NEW
│   ├── VisaItem.tsx            ← NEW
│   ├── WeatherCard.tsx         ← NEW
│   ├── ActivityItem.tsx        ← NEW
│   ├── TravelBanner.tsx        ← NEW
│   └── index.ts                ← NEW
├── map/                        (existing, unchanged)
├── export/                     (existing, unchanged)
├── Navbar.tsx                  (existing)
├── Providers.tsx               (existing)
└── WorldMapSVG.tsx             (existing)
```

---

## Design Constraints

1. **Tailwind v4** — no tailwind.config.ts; all utilities reference CSS variables from `globals.css`
2. **No new design tokens** — only use existing: `primary`, `accent`, `border`, `muted`, `card`, etc.
3. **Framer Motion** — use for all animations (already a dep); not CSS transitions
4. **Accessibility** — `Toggle` needs `role="switch"` + `aria-checked`; `TabBar` needs `role="tablist"` + `role="tab"`
5. **`forwardRef`** — all form controls (`Input`, `Select`) must use `forwardRef` (matches existing `Button` pattern)
6. **`"use client"`** — all interactive components need this directive
7. **Named exports** — no default exports (matches existing pattern)
8. **Barrel exports** — all new components added to their folder's `index.ts`

---

## Out of Scope

- No Storybook or visual docs (not needed for Phase 0 demo)
- No `Dialog`/`Modal` component (no modals in current design)
- No `Table` abstraction (summary table is a one-off)
- No compound component patterns (too complex for Phase 0 timeline)
- No dark mode testing (tokens exist but not a Phase 0 deliverable)